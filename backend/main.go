package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"net/url"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"github.com/jackc/pgx/v5/pgxpool"
)

// --- MODELS (минимальный набор для пользователей и договоров) ---

type UserRole string

const (
	UserRoleClinic       UserRole = "clinic"
	UserRoleOrganization UserRole = "organization"
	UserRoleDoctor       UserRole = "doctor"
	UserRoleEmployee     UserRole = "employee"
	UserRoleRegistration UserRole = "registration"
)

type User struct {
	ID          string   `json:"uid"`
	Role        UserRole `json:"role"`
	BIN         *string  `json:"bin,omitempty"`
	CompanyName *string  `json:"companyName,omitempty"`
	LeaderName  *string  `json:"leaderName,omitempty"`
	Phone       string   `json:"phone"`
	CreatedAt   string   `json:"createdAt"`
	// Для врачей
	DoctorID  *string `json:"doctorId,omitempty"`
	ClinicID  *string `json:"clinicId,omitempty"`
	Specialty *string `json:"specialty,omitempty"`
	ClinicBIN *string `json:"clinicBin,omitempty"`
	// Для сотрудников
	EmployeeID *string `json:"employeeId,omitempty"`
	ContractID *string `json:"contractId,omitempty"`
}

type AmbulatoryCard struct {
	ID         int64           `json:"id"`
	PatientUID string          `json:"patientUid"`
	IIN        string          `json:"iin"`
	General    json.RawMessage `json:"general"`
	Medical    json.RawMessage `json:"medical"`
	Spec       json.RawMessage `json:"specialistEntries,omitempty"`
	Labs       json.RawMessage `json:"labResults,omitempty"`
	Final      json.RawMessage `json:"finalConclusion,omitempty"`
	Comm       json.RawMessage `json:"communication,omitempty"`
	Instr      *string         `json:"patientInstruction,omitempty"`
	CreatedAt  string          `json:"createdAt"`
	UpdatedAt  string          `json:"updatedAt"`
}

type CalendarPlan struct {
	StartDate string  `json:"startDate"`
	EndDate   string  `json:"endDate"`
	Status    string  `json:"status"`
	Reason    *string `json:"rejectReason,omitempty"`
}

type ContractStatus string

type Contract struct {
	ID               int64          `json:"id"`
	Number           string         `json:"number"`
	ClientName       string         `json:"clientName"`
	ClientBIN        string         `json:"clientBin"`
	ClientSigned     bool           `json:"clientSigned"`
	ClinicName       string         `json:"clinicName"`
	ClinicBIN        string         `json:"clinicBin"`
	ClinicSigned     bool           `json:"clinicSigned"`
	Date             string         `json:"date"`
	Status           ContractStatus `json:"status"`
	Price            float64        `json:"price"`
	PlannedHeadcount int            `json:"plannedHeadcount"`
	Employees        any            `json:"employees,omitempty"`
	Documents        any            `json:"documents,omitempty"`
	CalendarPlan     *CalendarPlan  `json:"calendarPlan,omitempty"`
	ClientSignOTP    *string        `json:"clientSignOtp,omitempty"`
	ClinicSignOTP    *string        `json:"clinicSignOtp,omitempty"`
}

// Doctor belongs to clinic (clinic_uid from users.id with role=clinic)
type Doctor struct {
	ID         int64   `json:"id"`
	ClinicUID  string  `json:"clinicUid"`
	Name       string  `json:"name"`
	Specialty  string  `json:"specialty"`
	Phone      string  `json:"phone,omitempty"`
	IsChairman bool    `json:"isChairman"`
	RoomNumber *string `json:"roomNumber,omitempty"` // Номер кабинета (может меняться)
}

// --- GLOBAL STATE ---

var db *pgxpool.Pool

// --- WEBSOCKET ---

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		// Разрешаем подключения с любого origin (для разработки)
		// В продакшене нужно проверять origin
		return true
	},
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

// WebSocketMessage - структура сообщения WebSocket
type WebSocketMessage struct {
	Type      string      `json:"type"`
	Data      interface{} `json:"data"`
	Timestamp string      `json:"timestamp"`
	UserID    string      `json:"userId,omitempty"`
}

// Client - подключенный WebSocket клиент
type Client struct {
	ID     string
	UserID string
	Role   UserRole
	Conn   *websocket.Conn
	Send   chan WebSocketMessage
	Hub    *Hub
	mu     sync.Mutex
}

// Hub - центр управления WebSocket подключениями
type Hub struct {
	clients    map[*Client]bool
	broadcast  chan WebSocketMessage
	register   chan *Client
	unregister chan *Client
	mu         sync.RWMutex
}

// NewHub создает новый Hub
func NewHub() *Hub {
	return &Hub{
		clients:    make(map[*Client]bool),
		broadcast:  make(chan WebSocketMessage, 256),
		register:   make(chan *Client),
		unregister: make(chan *Client),
	}
}

// Run запускает Hub
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client] = true
			h.mu.Unlock()
			log.Printf("WebSocket client connected: %s (user: %s)", client.ID, client.UserID)

		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.Send)
			}
			h.mu.Unlock()
			log.Printf("WebSocket client disconnected: %s", client.ID)

		case message := <-h.broadcast:
			h.mu.RLock()
			for client := range h.clients {
				select {
				case client.Send <- message:
				default:
					close(client.Send)
					delete(h.clients, client)
				}
			}
			h.mu.RUnlock()
		}
	}
}

// BroadcastToUser отправляет сообщение конкретному пользователю
func (h *Hub) BroadcastToUser(userID string, message WebSocketMessage) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	for client := range h.clients {
		if client.UserID == userID {
			select {
			case client.Send <- message:
			default:
				close(client.Send)
				delete(h.clients, client)
			}
		}
	}
}

// BroadcastToRole отправляет сообщение всем пользователям с определенной ролью
func (h *Hub) BroadcastToRole(role UserRole, message WebSocketMessage) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	for client := range h.clients {
		if client.Role == role {
			select {
			case client.Send <- message:
			default:
				close(client.Send)
				delete(h.clients, client)
			}
		}
	}
}

// BroadcastToUsers отправляет сообщение нескольким пользователям
func (h *Hub) BroadcastToUsers(userIDs []string, message WebSocketMessage) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	userMap := make(map[string]bool)
	for _, id := range userIDs {
		userMap[id] = true
	}

	for client := range h.clients {
		if userMap[client.UserID] {
			select {
			case client.Send <- message:
			default:
				close(client.Send)
				delete(h.clients, client)
			}
		}
	}
}

// readPump читает сообщения от клиента
func (c *Client) readPump() {
	defer func() {
		c.Hub.unregister <- c
		c.Conn.Close()
	}()

	c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	c.Conn.SetPongHandler(func(string) error {
		c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	for {
		_, _, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
			break
		}
	}
}

// writePump отправляет сообщения клиенту
func (c *Client) writePump() {
	ticker := time.NewTicker(54 * time.Second)
	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.Send:
			c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.Conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			json.NewEncoder(w).Encode(message)

			n := len(c.Send)
			for i := 0; i < n; i++ {
				json.NewEncoder(w).Encode(<-c.Send)
			}

			if err := w.Close(); err != nil {
				return
			}

		case <-ticker.C:
			c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

var hub *Hub

// wsHandler обрабатывает WebSocket подключения
func wsHandler(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}

	// Получаем userID из query параметров или заголовков
	userID := r.URL.Query().Get("userId")
	if userID == "" {
		userID = r.Header.Get("X-User-ID")
	}
	if userID == "" {
		conn.Close()
		return
	}

	// Получаем роль пользователя из БД
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	var role UserRole
	var bin *string
	err = db.QueryRow(ctx, "SELECT role, bin FROM users WHERE id = $1", userID).Scan(&role, &bin)
	if err != nil {
		log.Printf("Error getting user for WebSocket: %v", err)
		conn.Close()
		return
	}

	client := &Client{
		ID:     fmt.Sprintf("client_%d_%s", time.Now().UnixNano(), userID),
		UserID: userID,
		Role:   role,
		Conn:   conn,
		Send:   make(chan WebSocketMessage, 256),
		Hub:    hub,
	}

	hub.register <- client

	go client.writePump()
	go client.readPump()
}

// broadcastMessage отправляет сообщение всем подключенным клиентам
func broadcastMessage(messageType string, data interface{}) {
	if hub == nil {
		return
	}
	hub.broadcast <- WebSocketMessage{
		Type:      messageType,
		Data:      data,
		Timestamp: time.Now().Format(time.RFC3339),
	}
}

// broadcastToUser отправляет сообщение конкретному пользователю
func broadcastToUser(userID string, messageType string, data interface{}) {
	if hub == nil {
		return
	}
	hub.BroadcastToUser(userID, WebSocketMessage{
		Type:      messageType,
		Data:      data,
		Timestamp: time.Now().Format(time.RFC3339),
		UserID:    userID,
	})
}

// broadcastToRole отправляет сообщение всем пользователям с определенной ролью
func broadcastToRole(role UserRole, messageType string, data interface{}) {
	if hub == nil {
		return
	}
	hub.BroadcastToRole(role, WebSocketMessage{
		Type:      messageType,
		Data:      data,
		Timestamp: time.Now().Format(time.RFC3339),
	})
}

// broadcastToUsers отправляет сообщение нескольким пользователям
func broadcastToUsers(userIDs []string, messageType string, data interface{}) {
	if hub == nil {
		return
	}
	hub.BroadcastToUsers(userIDs, WebSocketMessage{
		Type:      messageType,
		Data:      data,
		Timestamp: time.Now().Format(time.RFC3339),
	})
}

// --- HELPERS ---

func jsonResponse(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	// Всегда кодируем значение, даже если это nil (запишет "null")
	_ = json.NewEncoder(w).Encode(v)
}

func errorResponse(w http.ResponseWriter, status int, msg string) {
	jsonResponse(w, status, map[string]string{"error": msg})
}

// --- DB INIT & MIGRATIONS ---

func mustGetEnv(key, def string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return def
}

func initDB(ctx context.Context) (*pgxpool.Pool, error) {
	host := mustGetEnv("DB_HOST", "localhost")
	port := mustGetEnv("DB_PORT", "5432")
	user := mustGetEnv("DB_USER", "medflow")
	pass := mustGetEnv("DB_PASSWORD", "medflow_password")
	name := mustGetEnv("DB_NAME", "medflow")

	dsn := fmt.Sprintf("postgres://%s:%s@%s:%s/%s", user, pass, host, port, name)

	cfg, err := pgxpool.ParseConfig(dsn)
	if err != nil {
		return nil, fmt.Errorf("parse dsn: %w", err)
	}

	// Оптимизация пула соединений для многопоточности и производительности
	cfg.MaxConns = 25                               // Максимальное количество соединений
	cfg.MinConns = 5                                // Минимальное количество соединений (для быстрого старта)
	cfg.MaxConnLifetime = time.Hour                 // Время жизни соединения
	cfg.MaxConnIdleTime = time.Minute * 30          // Время простоя соединения
	cfg.HealthCheckPeriod = time.Minute             // Период проверки здоровья соединений
	cfg.ConnConfig.ConnectTimeout = time.Second * 5 // Таймаут подключения

	pool, err := pgxpool.NewWithConfig(ctx, cfg)
	if err != nil {
		return nil, fmt.Errorf("connect db: %w", err)
	}

	// Проверяем соединение
	if err := pool.Ping(ctx); err != nil {
		return nil, fmt.Errorf("ping db: %w", err)
	}

	// Простые миграции (CREATE TABLE IF NOT EXISTS)
	tx, err := pool.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	_, err = tx.Exec(ctx, `
CREATE TABLE IF NOT EXISTS users (
  id           TEXT PRIMARY KEY,
  role         TEXT NOT NULL,
  bin          TEXT,
  company_name TEXT,
  leader_name  TEXT,
  phone        TEXT NOT NULL UNIQUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  doctor_id    TEXT,
  clinic_id    TEXT,
  specialty    TEXT,
  clinic_bin   TEXT,
  employee_id  TEXT,
  contract_id  TEXT
);
`)
	if err != nil {
		return nil, fmt.Errorf("migrate users: %w", err)
	}

	// Уникальный индекс на БИН для организаций и клиник (где bin IS NOT NULL)
	_, err = tx.Exec(ctx, `
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_bin_unique ON users(bin) 
WHERE bin IS NOT NULL AND (role = 'clinic' OR role = 'organization');
`)
	if err != nil {
		return nil, fmt.Errorf("migrate users: %w", err)
	}

	_, err = tx.Exec(ctx, `
CREATE TABLE IF NOT EXISTS contracts (
  id                SERIAL PRIMARY KEY,
  number            TEXT NOT NULL,
  client_name       TEXT NOT NULL,
  client_bin        TEXT NOT NULL,
  client_signed     BOOLEAN NOT NULL DEFAULT FALSE,
  clinic_name       TEXT NOT NULL,
  clinic_bin        TEXT NOT NULL,
  clinic_signed     BOOLEAN NOT NULL DEFAULT FALSE,
  date              DATE NOT NULL,
  status            TEXT NOT NULL,
  price             DOUBLE PRECISION NOT NULL,
  planned_headcount INTEGER NOT NULL,
  employees         JSONB,
  documents         JSONB,
  calendar_plan     JSONB,
  client_sign_otp   TEXT,
  clinic_sign_otp   TEXT
);
`)
	if err != nil {
		return nil, fmt.Errorf("migrate contracts: %w", err)
	}

	_, err = tx.Exec(ctx, `
CREATE TABLE IF NOT EXISTS doctors (
  id           SERIAL PRIMARY KEY,
  clinic_uid   TEXT NOT NULL,
  name         TEXT NOT NULL,
  specialty    TEXT NOT NULL,
  phone        TEXT,
  is_chairman  BOOLEAN NOT NULL DEFAULT FALSE,
  room_number  TEXT
);
`)
	if err != nil {
		return nil, fmt.Errorf("migrate doctors: %w", err)
	}

	_, err = tx.Exec(ctx, `
CREATE TABLE IF NOT EXISTS route_sheets (
  id           SERIAL PRIMARY KEY,
  doctor_id    TEXT NOT NULL,
  contract_id  INTEGER NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  specialty    TEXT,
  virtual_doctor BOOLEAN NOT NULL DEFAULT FALSE,
  employees    JSONB NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(doctor_id, contract_id)
);
`)
	if err != nil {
		return nil, fmt.Errorf("migrate route_sheets: %w", err)
	}

	// Индексы для быстрого поиска
	_, err = tx.Exec(ctx, `CREATE INDEX IF NOT EXISTS idx_route_sheets_doctor ON route_sheets(doctor_id);`)
	if err != nil {
		return nil, fmt.Errorf("create index route_sheets_doctor: %w", err)
	}

	_, err = tx.Exec(ctx, `CREATE INDEX IF NOT EXISTS idx_route_sheets_contract ON route_sheets(contract_id);`)
	if err != nil {
		return nil, fmt.Errorf("create index route_sheets_contract: %w", err)
	}

	// Дополнительные индексы для производительности
	_, err = tx.Exec(ctx, `CREATE INDEX IF NOT EXISTS idx_users_bin ON users(bin) WHERE bin IS NOT NULL;`)
	if err != nil {
		return nil, fmt.Errorf("create index users_bin: %w", err)
	}

	// Уникальный индекс на БИН для организаций и клиник (чтобы один БИН не мог быть зарегистрирован дважды)
	_, err = tx.Exec(ctx, `
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_bin_unique ON users(bin) 
WHERE bin IS NOT NULL AND (role = 'clinic' OR role = 'organization');
`)
	if err != nil {
		return nil, fmt.Errorf("create unique index users_bin: %w", err)
	}

	_, err = tx.Exec(ctx, `CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);`)
	if err != nil {
		return nil, fmt.Errorf("create index users_role: %w", err)
	}

	_, err = tx.Exec(ctx, `CREATE INDEX IF NOT EXISTS idx_contracts_client_bin ON contracts(client_bin);`)
	if err != nil {
		return nil, fmt.Errorf("create index contracts_client_bin: %w", err)
	}

	_, err = tx.Exec(ctx, `CREATE INDEX IF NOT EXISTS idx_contracts_clinic_bin ON contracts(clinic_bin);`)
	if err != nil {
		return nil, fmt.Errorf("create index contracts_clinic_bin: %w", err)
	}

	_, err = tx.Exec(ctx, `CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);`)
	if err != nil {
		return nil, fmt.Errorf("create index contracts_status: %w", err)
	}

	_, err = tx.Exec(ctx, `CREATE INDEX IF NOT EXISTS idx_doctors_clinic_uid ON doctors(clinic_uid);`)
	if err != nil {
		return nil, fmt.Errorf("create index doctors_clinic_uid: %w", err)
	}

	// Таблица для регистрации посещений сотрудников
	_, err = tx.Exec(ctx, `
CREATE TABLE IF NOT EXISTS employee_visits (
  id           SERIAL PRIMARY KEY,
  employee_id  TEXT NOT NULL,
  employee_name TEXT,
  client_name  TEXT,
  contract_id  INTEGER REFERENCES contracts(id) ON DELETE SET NULL,
  clinic_id    TEXT NOT NULL,
  visit_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  check_in_time TIMESTAMPTZ,
  check_out_time TIMESTAMPTZ,
  status       TEXT NOT NULL DEFAULT 'registered',
  route_sheet  JSONB DEFAULT '[]'::jsonb,
  documents_issued JSONB DEFAULT '[]'::jsonb,
  registered_by TEXT,
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Для индивидуальных пациентов (без договора) contract_id будет NULL
  CONSTRAINT valid_status CHECK (status IN ('registered', 'in_progress', 'completed', 'cancelled'))
);
`)
	if err != nil {
		return nil, fmt.Errorf("migrate employee_visits: %w", err)
	}

	_, err = tx.Exec(ctx, `
CREATE TABLE IF NOT EXISTS ambulatory_cards (
  id           SERIAL PRIMARY KEY,
  patient_uid  TEXT NOT NULL UNIQUE,
  iin          TEXT NOT NULL,
  general      JSONB NOT NULL DEFAULT '{}',
  medical      JSONB NOT NULL DEFAULT '{}',
  communication TEXT,
  patient_instruction TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`)
	if err != nil {
		return nil, fmt.Errorf("migrate ambulatory_cards: %w", err)
	}

	// Migration Version: 2024-12-22-v4 - FINAL FIX (NO employee_id DROP NOT NULL!)
	// Добавляем недостающие поля в существующие таблицы (только IF NOT EXISTS)
	// НЕТ НИКАКИХ ALTER COLUMN DROP NOT NULL для ambulatory_cards!
	log.Printf("INFO: [v4-FINAL] Adding missing columns to tables if needed...")

	_, _ = tx.Exec(ctx, `ALTER TABLE employee_visits DROP COLUMN IF EXISTS route_sheet_id;`)
	_, _ = tx.Exec(ctx, `ALTER TABLE employee_visits ADD COLUMN IF NOT EXISTS route_sheet JSONB DEFAULT '[]'::jsonb;`)
	_, _ = tx.Exec(ctx, `ALTER TABLE doctors ADD COLUMN IF NOT EXISTS room_number TEXT;`)
	_, _ = tx.Exec(ctx, `ALTER TABLE employee_visits ADD COLUMN IF NOT EXISTS employee_name TEXT;`)
	_, _ = tx.Exec(ctx, `ALTER TABLE employee_visits ADD COLUMN IF NOT EXISTS client_name TEXT;`)
	_, _ = tx.Exec(ctx, `ALTER TABLE ambulatory_cards ADD COLUMN IF NOT EXISTS specialist_entries JSONB DEFAULT '{}'::jsonb;`)
	_, _ = tx.Exec(ctx, `ALTER TABLE ambulatory_cards ADD COLUMN IF NOT EXISTS lab_results JSONB DEFAULT '{}'::jsonb;`)
	_, _ = tx.Exec(ctx, `ALTER TABLE ambulatory_cards ADD COLUMN IF NOT EXISTS final_conclusion JSONB DEFAULT '{}'::jsonb;`)

	log.Printf("INFO: Table columns updated successfully")

	_, err = tx.Exec(ctx, `CREATE INDEX IF NOT EXISTS idx_employee_visits_employee ON employee_visits(employee_id);`)
	if err != nil {
		return nil, fmt.Errorf("create index employee_visits_employee: %w", err)
	}

	_, err = tx.Exec(ctx, `CREATE INDEX IF NOT EXISTS idx_employee_visits_contract ON employee_visits(contract_id) WHERE contract_id IS NOT NULL;`)
	if err != nil {
		return nil, fmt.Errorf("create index employee_visits_contract: %w", err)
	}

	_, err = tx.Exec(ctx, `CREATE INDEX IF NOT EXISTS idx_employee_visits_clinic ON employee_visits(clinic_id);`)
	if err != nil {
		return nil, fmt.Errorf("create index employee_visits_clinic: %w", err)
	}

	_, err = tx.Exec(ctx, `CREATE INDEX IF NOT EXISTS idx_employee_visits_status ON employee_visits(status);`)
	if err != nil {
		return nil, fmt.Errorf("create index employee_visits_status: %w", err)
	}

	_, err = tx.Exec(ctx, `CREATE INDEX IF NOT EXISTS idx_employee_visits_date ON employee_visits(visit_date);`)
	if err != nil {
		return nil, fmt.Errorf("create index employee_visits_date: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("commit migrations: %w", err)
	}

	return pool, nil
}

// --- HANDLERS ---

// Healthcheck
func healthHandler(w http.ResponseWriter, r *http.Request) {
	jsonResponse(w, http.StatusOK, map[string]string{"status": "ok"})
}

// GET /api/users/by-phone?phone=7700...
func getUserByPhoneHandler(w http.ResponseWriter, r *http.Request) {
	phone := r.URL.Query().Get("phone")
	if phone == "" {
		errorResponse(w, http.StatusBadRequest, "phone is required")
		return
	}

	// Контекст с таймаутом для быстрого ответа
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	row := db.QueryRow(ctx, `
SELECT id, role, bin, company_name, leader_name, phone, created_at, doctor_id, clinic_id, specialty, clinic_bin, employee_id, contract_id
FROM users WHERE phone = $1
`, phone)

	var u User
	var createdAt time.Time
	if err := row.Scan(&u.ID, &u.Role, &u.BIN, &u.CompanyName, &u.LeaderName, &u.Phone, &createdAt, &u.DoctorID, &u.ClinicID, &u.Specialty, &u.ClinicBIN, &u.EmployeeID, &u.ContractID); err != nil {
		// Not found
		log.Printf("DEBUG: getUserByPhone: user not found for phone [%s]", phone)
		jsonResponse(w, http.StatusOK, map[string]any{"user": nil})
		return
	}
	u.CreatedAt = createdAt.Format(time.RFC3339)
	log.Printf("DEBUG: getUserByPhone: found user [%s] role=[%s] for phone [%s]", u.ID, u.Role, phone)
	jsonResponse(w, http.StatusOK, map[string]any{"user": u})
}

// GET /api/users/by-bin?bin=123456789012
func getUserByBinHandler(w http.ResponseWriter, r *http.Request) {
	bin := r.URL.Query().Get("bin")
	if bin == "" {
		errorResponse(w, http.StatusBadRequest, "bin is required")
		return
	}

	// Контекст с таймаутом для быстрого ответа
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	// Ищем пользователя с нужной ролью (clinic или organization) и нужным BIN
	row := db.QueryRow(ctx, `
SELECT id, role, bin, company_name, leader_name, phone, created_at, doctor_id, clinic_id, specialty, clinic_bin, employee_id, contract_id
FROM users 
WHERE bin = $1 AND (role = 'clinic' OR role = 'organization')
LIMIT 1
`, bin)

	var u User
	var createdAt time.Time
	if err := row.Scan(&u.ID, &u.Role, &u.BIN, &u.CompanyName, &u.LeaderName, &u.Phone, &createdAt, &u.DoctorID, &u.ClinicID, &u.Specialty, &u.ClinicBIN, &u.EmployeeID, &u.ContractID); err != nil {
		// Not found
		jsonResponse(w, http.StatusOK, map[string]any{"user": nil})
		return
	}
	u.CreatedAt = createdAt.Format(time.RFC3339)
	jsonResponse(w, http.StatusOK, map[string]any{"user": u})
}

// GET /api/users/by-uid?uid=...
func getUserByUidHandler(w http.ResponseWriter, r *http.Request) {
	uid := r.URL.Query().Get("uid")
	if uid == "" {
		errorResponse(w, http.StatusBadRequest, "uid is required")
		return
	}

	// Контекст с таймаутом для быстрого ответа
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	row := db.QueryRow(ctx, `
SELECT id, role, bin, company_name, leader_name, phone, created_at, doctor_id, clinic_id, specialty, clinic_bin, employee_id, contract_id
FROM users 
WHERE id = $1
`, uid)

	var u User
	var createdAt time.Time
	if err := row.Scan(&u.ID, &u.Role, &u.BIN, &u.CompanyName, &u.LeaderName, &u.Phone, &createdAt, &u.DoctorID, &u.ClinicID, &u.Specialty, &u.ClinicBIN, &u.EmployeeID, &u.ContractID); err != nil {
		// Not found
		jsonResponse(w, http.StatusOK, map[string]any{"user": nil})
		return
	}
	u.CreatedAt = createdAt.Format(time.RFC3339)
	jsonResponse(w, http.StatusOK, map[string]any{"user": u})
}

// POST /api/users
func createUserHandler(w http.ResponseWriter, r *http.Request) {
	var in User
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		errorResponse(w, http.StatusBadRequest, "invalid json")
		return
	}

	if in.ID == "" || in.Phone == "" || in.Role == "" {
		errorResponse(w, http.StatusBadRequest, "uid, phone, role are required")
		return
	}

	// Контекст с таймаутом для быстрого ответа
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	// Проверка на занятость БИН для организаций и клиник
	if in.BIN != nil && *in.BIN != "" && (in.Role == "clinic" || in.Role == "organization") {
		var existingBin string
		err := db.QueryRow(ctx, `
SELECT bin FROM users 
WHERE bin = $1 AND (role = 'clinic' OR role = 'organization') AND phone != $2
LIMIT 1
`, *in.BIN, in.Phone).Scan(&existingBin)
		if err == nil && existingBin != "" {
			errorResponse(w, http.StatusConflict, fmt.Sprintf("БИН %s уже зарегистрирован в системе", *in.BIN))
			return
		}
	}

	_, err := db.Exec(ctx, `
INSERT INTO users (id, role, bin, company_name, leader_name, phone, doctor_id, clinic_id, specialty, clinic_bin, employee_id, contract_id)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
ON CONFLICT (phone) DO UPDATE SET
  role = CASE 
    WHEN EXCLUDED.role = 'doctor' OR EXCLUDED.role = 'registration' THEN EXCLUDED.role 
    ELSE users.role 
  END,
  bin = COALESCE(EXCLUDED.bin, users.bin),
  company_name = COALESCE(EXCLUDED.company_name, users.company_name),
  leader_name = COALESCE(EXCLUDED.leader_name, users.leader_name),
  doctor_id = COALESCE(EXCLUDED.doctor_id, users.doctor_id),
  clinic_id = COALESCE(EXCLUDED.clinic_id, users.clinic_id),
  specialty = COALESCE(EXCLUDED.specialty, users.specialty),
  clinic_bin = COALESCE(EXCLUDED.clinic_bin, users.clinic_bin),
  employee_id = COALESCE(EXCLUDED.employee_id, users.employee_id),
  contract_id = COALESCE(EXCLUDED.contract_id, users.contract_id)
`, in.ID, in.Role, in.BIN, in.CompanyName, in.LeaderName, in.Phone, in.DoctorID, in.ClinicID, in.Specialty, in.ClinicBIN, in.EmployeeID, in.ContractID)
	if err != nil {
		log.Printf("createUser error: %v", err)
		// Проверяем, является ли ошибка нарушением уникальности БИН
		if strings.Contains(err.Error(), "idx_users_bin_unique") || strings.Contains(err.Error(), "duplicate key") {
			errorResponse(w, http.StatusConflict, fmt.Sprintf("БИН %s уже зарегистрирован в системе", func() string {
				if in.BIN != nil {
					return *in.BIN
				}
				return ""
			}()))
			return
		}
		errorResponse(w, http.StatusInternalServerError, "db error")
		return
	}

	jsonResponse(w, http.StatusCreated, map[string]string{"status": "ok"})
}

// GET /api/contracts?bin=...
func listContractsHandler(w http.ResponseWriter, r *http.Request) {
	bin := r.URL.Query().Get("bin")
	if bin == "" {
		errorResponse(w, http.StatusBadRequest, "bin is required")
		return
	}

	// Контекст с таймаутом для быстрого ответа
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	rows, err := db.Query(ctx, `
SELECT id, number, client_name, client_bin, client_signed,
       clinic_name, clinic_bin, clinic_signed,
       date, status, price, planned_headcount,
       employees, documents, calendar_plan, client_sign_otp, clinic_sign_otp
FROM contracts
WHERE client_bin = $1 OR clinic_bin = $1
ORDER BY date DESC, id DESC
`, bin)
	if err != nil {
		log.Printf("listContracts error: %v", err)
		errorResponse(w, http.StatusInternalServerError, "db error")
		return
	}
	defer rows.Close()

	var res []Contract
	for rows.Next() {
		var c Contract
		var date time.Time
		var employeesJSON, documentsJSON, cpJSON []byte
		if err := rows.Scan(
			&c.ID, &c.Number,
			&c.ClientName, &c.ClientBIN, &c.ClientSigned,
			&c.ClinicName, &c.ClinicBIN, &c.ClinicSigned,
			&date, &c.Status, &c.Price, &c.PlannedHeadcount,
			&employeesJSON, &documentsJSON, &cpJSON, &c.ClientSignOTP, &c.ClinicSignOTP,
		); err != nil {
			log.Printf("scan contract: %v", err)
			continue
		}
		c.Date = date.Format("2006-01-02")
		if len(employeesJSON) > 0 {
			c.Employees = json.RawMessage(employeesJSON)
		}
		if len(documentsJSON) > 0 {
			c.Documents = json.RawMessage(documentsJSON)
		}
		if len(cpJSON) > 0 {
			var cp CalendarPlan
			if err := json.Unmarshal(cpJSON, &cp); err == nil {
				c.CalendarPlan = &cp
			}
		}
		res = append(res, c)
	}

	// Всегда возвращаем массив, даже если пустой
	if res == nil {
		res = []Contract{}
	}
	jsonResponse(w, http.StatusOK, res)
}

// POST /api/contracts
func createContractHandler(w http.ResponseWriter, r *http.Request) {
	var in Contract
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		errorResponse(w, http.StatusBadRequest, "invalid json")
		return
	}

	if in.ClientBIN == "" || in.ClinicBIN == "" || in.ClientName == "" || in.ClinicName == "" {
		errorResponse(w, http.StatusBadRequest, "client/clinic required")
		return
	}
	if in.Date == "" {
		in.Date = time.Now().Format("2006-01-02")
	}
	// Если номер не указан, генерируем его автоматически
	if in.Number == "" || in.Number == "DRAFT" {
		year := time.Now().Year()
		randomId := 1000 + rand.Intn(9000) // Генерируем случайное число от 1000 до 9999
		in.Number = fmt.Sprintf("D-%d/%d", year, randomId)
	}
	if in.Status == "" {
		in.Status = "request"
	}

	// Контекст с таймаутом для быстрого ответа
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	var id int64
	err := db.QueryRow(ctx, `
INSERT INTO contracts (
  number, client_name, client_bin, client_signed,
  clinic_name, clinic_bin, clinic_signed,
  date, status, price, planned_headcount, employees, documents, calendar_plan,
  client_sign_otp, clinic_sign_otp
) VALUES (
  $1,$2,$3,false,
  $4,$5,false,
  $6,$7,$8,$9,$10,$11,$12,
  $13,$14
) RETURNING id
`, in.Number, in.ClientName, in.ClientBIN,
		in.ClinicName, in.ClinicBIN,
		in.Date, in.Status, in.Price, in.PlannedHeadcount,
		in.Employees, in.Documents, nil,
		in.ClientSignOTP, in.ClinicSignOTP,
	).Scan(&id)
	if err != nil {
		log.Printf("createContract error: %v", err)
		errorResponse(w, http.StatusInternalServerError, "db error")
		return
	}

	in.ID = id

	// Отправляем событие о создании контракта
	// Находим пользователей клиники и организации для отправки событий
	var clinicUserID, orgUserID string
	db.QueryRow(ctx, "SELECT id FROM users WHERE bin = $1 AND role = 'clinic' LIMIT 1", in.ClinicBIN).Scan(&clinicUserID)
	db.QueryRow(ctx, "SELECT id FROM users WHERE bin = $1 AND role = 'organization' LIMIT 1", in.ClientBIN).Scan(&orgUserID)

	if clinicUserID != "" || orgUserID != "" {
		userIDs := []string{}
		if clinicUserID != "" {
			userIDs = append(userIDs, clinicUserID)
		}
		if orgUserID != "" {
			userIDs = append(userIDs, orgUserID)
		}
		broadcastToUsers(userIDs, "contract_created", map[string]interface{}{
			"contractId": id,
			"contract":   in,
		})
	}

	jsonResponse(w, http.StatusCreated, in)
}

// PATCH /api/contracts/{id}
func updateContractHandler(w http.ResponseWriter, r *http.Request) {
	// простой разбор ID из пути: /api/contracts/{id}
	var id int64
	_, err := fmt.Sscanf(r.URL.Path, "/api/contracts/%d", &id)
	if err != nil || id <= 0 {
		errorResponse(w, http.StatusBadRequest, "invalid id")
		return
	}

	var patch map[string]any
	if err := json.NewDecoder(r.Body).Decode(&patch); err != nil {
		errorResponse(w, http.StatusBadRequest, "invalid json")
		return
	}

	// Контекст с таймаутом для быстрого ответа
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	// Обновляем только поля, которые реально используются сейчас (status, employees, documents, calendarPlan, clientSigned, clinicSigned, clientSignOtp, clinicSignOtp, number)
	if v, ok := patch["calendarPlan"]; ok {
		b, _ := json.Marshal(v)
		_, err = db.Exec(ctx, `UPDATE contracts SET calendar_plan = $1 WHERE id = $2`, b, id)
		if err != nil {
			log.Printf("update calendarPlan: %v", err)
		}
	}
	if v, ok := patch["employees"]; ok {
		b, _ := json.Marshal(v)
		_, err = db.Exec(ctx, `UPDATE contracts SET employees = $1 WHERE id = $2`, b, id)
		if err != nil {
			log.Printf("update employees: %v", err)
		}
	}
	if v, ok := patch["documents"]; ok {
		b, _ := json.Marshal(v)
		_, err = db.Exec(ctx, `UPDATE contracts SET documents = $1 WHERE id = $2`, b, id)
		if err != nil {
			log.Printf("update documents: %v", err)
		}
	}
	if v, ok := patch["status"]; ok {
		_, err = db.Exec(ctx, `UPDATE contracts SET status = $1 WHERE id = $2`, v, id)
		if err != nil {
			log.Printf("update status: %v", err)
		}
	}
	if v, ok := patch["clientSigned"]; ok {
		_, err = db.Exec(ctx, `UPDATE contracts SET client_signed = $1 WHERE id = $2`, v, id)
		if err != nil {
			log.Printf("update clientSigned: %v", err)
		}
	}
	if v, ok := patch["clinicSigned"]; ok {
		_, err = db.Exec(ctx, `UPDATE contracts SET clinic_signed = $1 WHERE id = $2`, v, id)
		if err != nil {
			log.Printf("update clinicSigned: %v", err)
		}
	}
	if v, ok := patch["clientSignOtp"]; ok {
		_, err = db.Exec(ctx, `UPDATE contracts SET client_sign_otp = $1 WHERE id = $2`, v, id)
		if err != nil {
			log.Printf("update clientSignOtp: %v", err)
		}
	}
	if v, ok := patch["clinicSignOtp"]; ok {
		_, err = db.Exec(ctx, `UPDATE contracts SET clinic_sign_otp = $1 WHERE id = $2`, v, id)
		if err != nil {
			log.Printf("update clinicSignOtp: %v", err)
		}
	}
	if v, ok := patch["number"]; ok {
		_, err = db.Exec(ctx, `UPDATE contracts SET number = $1 WHERE id = $2`, v, id)
		if err != nil {
			log.Printf("update number: %v", err)
		}
	}

	// Отправляем событие об обновлении контракта
	// Получаем информацию о контракте для отправки
	var clinicBIN, clientBIN string
	err = db.QueryRow(ctx, "SELECT clinic_bin, client_bin FROM contracts WHERE id = $1", id).Scan(&clinicBIN, &clientBIN)
	if err == nil {
		var clinicUserID, orgUserID string
		db.QueryRow(ctx, "SELECT id FROM users WHERE bin = $1 AND role = 'clinic' LIMIT 1", clinicBIN).Scan(&clinicUserID)
		db.QueryRow(ctx, "SELECT id FROM users WHERE bin = $1 AND role = 'organization' LIMIT 1", clientBIN).Scan(&orgUserID)

		userIDs := []string{}
		if clinicUserID != "" {
			userIDs = append(userIDs, clinicUserID)
		}
		if orgUserID != "" {
			userIDs = append(userIDs, orgUserID)
		}

		if len(userIDs) > 0 {
			broadcastToUsers(userIDs, "contract_updated", map[string]interface{}{
				"contractId": id,
				"updates":    patch,
			})
		}
	}

	jsonResponse(w, http.StatusOK, map[string]string{"status": "ok"})
}

// GET /api/contracts/{id}
func getContractHandler(w http.ResponseWriter, r *http.Request) {
	var id int64
	_, err := fmt.Sscanf(r.URL.Path, "/api/contracts/%d", &id)
	if err != nil || id <= 0 {
		errorResponse(w, http.StatusBadRequest, "invalid id")
		return
	}

	// Контекст с таймаутом для быстрого ответа
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	row := db.QueryRow(ctx, `
SELECT id, number, client_name, client_bin, client_signed,
       clinic_name, clinic_bin, clinic_signed,
       date, status, price, planned_headcount,
       employees, documents, calendar_plan, client_sign_otp, clinic_sign_otp
FROM contracts
WHERE id = $1
`, id)

	var c Contract
	var date time.Time
	var employeesJSON, documentsJSON, cpJSON []byte
	if err := row.Scan(
		&c.ID, &c.Number,
		&c.ClientName, &c.ClientBIN, &c.ClientSigned,
		&c.ClinicName, &c.ClinicBIN, &c.ClinicSigned,
		&date, &c.Status, &c.Price, &c.PlannedHeadcount,
		&employeesJSON, &documentsJSON, &cpJSON,
		&c.ClientSignOTP, &c.ClinicSignOTP,
	); err != nil {
		log.Printf("getContract error: %v", err)
		errorResponse(w, http.StatusNotFound, "contract not found")
		return
	}

	c.Date = date.Format("2006-01-02")
	if len(employeesJSON) > 0 {
		c.Employees = json.RawMessage(employeesJSON)
	}
	if len(documentsJSON) > 0 {
		c.Documents = json.RawMessage(documentsJSON)
	}
	if len(cpJSON) > 0 {
		var cp CalendarPlan
		if err := json.Unmarshal(cpJSON, &cp); err == nil {
			c.CalendarPlan = &cp
		}
	}

	jsonResponse(w, http.StatusOK, c)
}

// --- DOCTORS HANDLERS ---

// GET /api/clinics/{clinicUid}/doctors
func listDoctorsHandler(w http.ResponseWriter, r *http.Request) {
	// Парсим путь правильно: /api/clinics/{clinicUid}/doctors
	path := r.URL.Path
	prefix := "/api/clinics/"
	suffix := "/doctors"

	if !strings.HasPrefix(path, prefix) || !strings.HasSuffix(path, suffix) {
		errorResponse(w, http.StatusBadRequest, "invalid clinic uid")
		return
	}

	clinicUID := strings.TrimPrefix(path, prefix)
	clinicUID = strings.TrimSuffix(clinicUID, suffix)
	clinicUID, err := url.PathUnescape(clinicUID) // Декодируем URL-encoded строку
	if err != nil || clinicUID == "" {
		errorResponse(w, http.StatusBadRequest, "invalid clinic uid")
		return
	}

	// Контекст с таймаутом для быстрого ответа
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	rows, err := db.Query(ctx, `
SELECT id, clinic_uid, name, specialty, phone, is_chairman, room_number
FROM doctors
WHERE clinic_uid = $1
ORDER BY name
`, clinicUID)
	if err != nil {
		log.Printf("listDoctors error: %v", err)
		errorResponse(w, http.StatusInternalServerError, "db error")
		return
	}
	defer rows.Close()

	var res []Doctor
	for rows.Next() {
		var d Doctor
		if err := rows.Scan(&d.ID, &d.ClinicUID, &d.Name, &d.Specialty, &d.Phone, &d.IsChairman, &d.RoomNumber); err != nil {
			log.Printf("scan doctor: %v", err)
			continue
		}
		res = append(res, d)
	}

	// Всегда возвращаем массив, даже если пустой
	if res == nil {
		res = []Doctor{}
	}
	jsonResponse(w, http.StatusOK, res)
}

// syncDoctorToUser создаёт или обновляет аккаунт пользователя для врача
func syncDoctorToUser(ctx context.Context, d Doctor) error {
	if d.Phone == "" {
		return nil
	}

	// Очищаем телефон (только цифры)
	cleanPhone := ""
	for _, r := range d.Phone {
		if r >= '0' && r <= '9' {
			cleanPhone += string(r)
		}
	}
	if len(cleanPhone) == 0 {
		return nil
	}

	// Определяем роль
	role := "doctor"
	if strings.ToLower(d.Specialty) == "регистратор" {
		role = "registration"
	}

	// Проверяем существующего пользователя по телефону
	var existingUID string
	_ = db.QueryRow(ctx, "SELECT id FROM users WHERE phone = $1", cleanPhone).Scan(&existingUID)

	uid := existingUID
	if existingUID == "" {
		uid = fmt.Sprintf("%s_%d", role, time.Now().UnixNano())
	}

	// Используем имя врача как компанию и лидера
	companyName := d.Name
	leaderName := d.Name

	_, err := db.Exec(ctx, `
INSERT INTO users (id, role, phone, company_name, leader_name, doctor_id, clinic_id, specialty, clinic_bin)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, (SELECT bin FROM users WHERE id = $7 AND role = 'clinic' LIMIT 1))
ON CONFLICT (phone) DO UPDATE SET
  role = EXCLUDED.role,
  company_name = EXCLUDED.company_name,
  leader_name = EXCLUDED.leader_name,
  doctor_id = EXCLUDED.doctor_id,
  clinic_id = EXCLUDED.clinic_id,
  specialty = EXCLUDED.specialty,
  clinic_bin = EXCLUDED.clinic_bin
`, uid, role, cleanPhone, companyName, leaderName, fmt.Sprintf("%d", d.ID), d.ClinicUID, d.Specialty)

	if err != nil {
		log.Printf("syncDoctorToUser error: %v", err)
		return err
	}

	log.Printf("DEBUG: syncDoctorToUser success for %s (%s) role=%s", d.Name, cleanPhone, role)
	return nil
}

// POST /api/clinics/{clinicUid}/doctors
func createDoctorHandler(w http.ResponseWriter, r *http.Request) {
	// Парсим путь правильно: /api/clinics/{clinicUid}/doctors
	path := r.URL.Path
	prefix := "/api/clinics/"
	suffix := "/doctors"

	if !strings.HasPrefix(path, prefix) || !strings.HasSuffix(path, suffix) {
		errorResponse(w, http.StatusBadRequest, "invalid clinic uid")
		return
	}

	clinicUID := strings.TrimPrefix(path, prefix)
	clinicUID = strings.TrimSuffix(clinicUID, suffix)
	clinicUID, err := url.PathUnescape(clinicUID) // Декодируем URL-encoded строку
	if err != nil || clinicUID == "" {
		errorResponse(w, http.StatusBadRequest, "invalid clinic uid")
		return
	}

	var in Doctor
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		errorResponse(w, http.StatusBadRequest, "invalid json")
		return
	}
	if in.Name == "" || in.Specialty == "" {
		errorResponse(w, http.StatusBadRequest, "name and specialty are required")
		return
	}

	// Контекст с таймаутом для быстрого ответа
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	var id int64
	err = db.QueryRow(ctx, `
INSERT INTO doctors (clinic_uid, name, specialty, phone, is_chairman, room_number)
VALUES ($1,$2,$3,$4,$5,$6)
RETURNING id
`, clinicUID, in.Name, in.Specialty, in.Phone, in.IsChairman, in.RoomNumber).Scan(&id)
	if err != nil {
		log.Printf("createDoctor error: %v", err)
		errorResponse(w, http.StatusInternalServerError, "db error")
		return
	}

	in.ID = id
	in.ClinicUID = clinicUID

	// Автоматическая синхронизация с таблицей пользователей
	syncDoctorToUser(ctx, in)

	// Отправляем событие о создании врача всем пользователям клиники
	broadcastToUser(clinicUID, "doctor_created", map[string]interface{}{
		"doctorId": id,
		"doctor":   in,
	})

	jsonResponse(w, http.StatusCreated, in)
}

// PUT /api/clinics/{clinicUid}/doctors/{id}
func updateDoctorHandler(w http.ResponseWriter, r *http.Request) {
	// Парсим путь правильно: /api/clinics/{clinicUid}/doctors/{id}
	path := r.URL.Path
	prefix := "/api/clinics/"

	if !strings.HasPrefix(path, prefix) {
		errorResponse(w, http.StatusBadRequest, "invalid params")
		return
	}

	// Убираем префикс и разбиваем на части
	rest := strings.TrimPrefix(path, prefix)
	parts := strings.Split(rest, "/doctors/")
	if len(parts) != 2 {
		errorResponse(w, http.StatusBadRequest, "invalid params")
		return
	}

	clinicUID, err := url.PathUnescape(parts[0])
	if err != nil || clinicUID == "" {
		errorResponse(w, http.StatusBadRequest, "invalid clinic uid")
		return
	}

	var id int64
	if _, err := fmt.Sscanf(parts[1], "%d", &id); err != nil || id <= 0 {
		errorResponse(w, http.StatusBadRequest, "invalid doctor id")
		return
	}

	var in Doctor
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		errorResponse(w, http.StatusBadRequest, "invalid json")
		return
	}
	if in.Name == "" || in.Specialty == "" {
		errorResponse(w, http.StatusBadRequest, "name and specialty are required")
		return
	}

	// Контекст с таймаутом для быстрого ответа
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	_, err = db.Exec(ctx, `
UPDATE doctors
SET name = $1, specialty = $2, phone = $3, is_chairman = $4, room_number = $5
WHERE id = $6 AND clinic_uid = $7
`, in.Name, in.Specialty, in.Phone, in.IsChairman, in.RoomNumber, id, clinicUID)
	if err != nil {
		log.Printf("updateDoctor error: %v", err)
		errorResponse(w, http.StatusInternalServerError, "db error")
		return
	}

	in.ID = id
	in.ClinicUID = clinicUID

	// Автоматическая синхронизация с таблицей пользователей
	syncDoctorToUser(ctx, in)

	// Отправляем событие об обновлении врача всем пользователям клиники
	broadcastToUser(clinicUID, "doctor_updated", map[string]interface{}{
		"doctorId": id,
		"doctor":   in,
	})

	jsonResponse(w, http.StatusOK, map[string]string{"status": "ok"})
}

// DELETE /api/clinics/{clinicUid}/doctors/{id}
func deleteDoctorHandler(w http.ResponseWriter, r *http.Request) {
	// Парсим путь правильно: /api/clinics/{clinicUid}/doctors/{id}
	path := r.URL.Path
	prefix := "/api/clinics/"

	if !strings.HasPrefix(path, prefix) {
		errorResponse(w, http.StatusBadRequest, "invalid params")
		return
	}

	// Убираем префикс и разбиваем на части
	rest := strings.TrimPrefix(path, prefix)
	parts := strings.Split(rest, "/doctors/")
	if len(parts) != 2 {
		errorResponse(w, http.StatusBadRequest, "invalid params")
		return
	}

	clinicUID, err := url.PathUnescape(parts[0])
	if err != nil || clinicUID == "" {
		errorResponse(w, http.StatusBadRequest, "invalid clinic uid")
		return
	}

	var id int64
	if _, err := fmt.Sscanf(parts[1], "%d", &id); err != nil || id <= 0 {
		errorResponse(w, http.StatusBadRequest, "invalid doctor id")
		return
	}

	// Контекст с таймаутом для быстрого ответа
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	// Сначала получаем информацию о враче для удаления связанного пользователя
	var doctorPhone *string
	err = db.QueryRow(ctx, `SELECT phone FROM doctors WHERE id = $1 AND clinic_uid = $2`, id, clinicUID).Scan(&doctorPhone)
	if err != nil {
		log.Printf("deleteDoctor: doctor not found: %v", err)
		errorResponse(w, http.StatusNotFound, "doctor not found")
		return
	}

	// Удаляем врача из таблицы doctors
	_, err = db.Exec(ctx, `DELETE FROM doctors WHERE id = $1 AND clinic_uid = $2`, id, clinicUID)
	if err != nil {
		log.Printf("deleteDoctor error: %v", err)
		errorResponse(w, http.StatusInternalServerError, "db error")
		return
	}

	// Удаляем связанного пользователя-врача из таблицы users, если есть
	if doctorPhone != nil && *doctorPhone != "" {
		_, err = db.Exec(ctx, `DELETE FROM users WHERE phone = $1 AND role = 'doctor'`, *doctorPhone)
		if err != nil {
			log.Printf("deleteDoctor: error deleting user: %v", err)
			// Не возвращаем ошибку, так как основная операция прошла успешно
		}
	}

	// Отправляем событие об удалении врача всем пользователям клиники
	broadcastToUser(clinicUID, "doctor_deleted", map[string]interface{}{
		"doctorId": id,
	})

	jsonResponse(w, http.StatusOK, map[string]string{"status": "ok"})
}

// --- ROUTE SHEETS, EMPLOYEE VISITS HANDLERS ---

type CreateVisitRequest struct {
	EmployeeID   string          `json:"employeeId"`
	EmployeeName string          `json:"employeeName"`
	ClientName   string          `json:"clientName"`
	ContractID   int64           `json:"contractId"`
	ClinicID     string          `json:"clinicId"`
	Phone        string          `json:"phone"`
	RouteSheet   json.RawMessage `json:"routeSheet"`
}

func createVisitHandler(w http.ResponseWriter, r *http.Request) {
	var in CreateVisitRequest
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		errorResponse(w, http.StatusBadRequest, "invalid json")
		return
	}

	log.Printf("DEBUG createVisit: employeeId=%s, employeeName=%s, clinicId=%s, routeSheet=%s", in.EmployeeID, in.EmployeeName, in.ClinicID, string(in.RouteSheet))

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	// 1. Создаем или обновляем пользователя-сотрудника
	contractIDStr := ""
	if in.ContractID > 0 {
		contractIDStr = fmt.Sprintf("%d", in.ContractID)
	}
	_, err := db.Exec(ctx, `
		INSERT INTO users (id, role, phone, employee_id, contract_id, clinic_id, company_name)
		VALUES ($1, 'employee', $2, $1, $3, $4, $5)
		ON CONFLICT (phone) DO UPDATE SET
			employee_id = EXCLUDED.employee_id,
			contract_id = EXCLUDED.contract_id,
			clinic_id = EXCLUDED.clinic_id,
			company_name = EXCLUDED.company_name
	`, in.EmployeeID, in.Phone, contractIDStr, in.ClinicID, in.EmployeeName)
	if err != nil {
		log.Printf("Error creating employee user: %v", err)
	}

	// 2. Создаем визит
	var visitID int64
	err = db.QueryRow(ctx, `
		INSERT INTO employee_visits (employee_id, employee_name, client_name, contract_id, clinic_id, status, route_sheet, check_in_time)
		VALUES ($1, $2, $3, $4, $5, 'in_progress', $6, NOW())
		RETURNING id
	`, in.EmployeeID, in.EmployeeName, in.ClientName, in.ContractID, in.ClinicID, in.RouteSheet).Scan(&visitID)

	if err != nil {
		log.Printf("createVisit error: %v", err)
		errorResponse(w, http.StatusInternalServerError, "db error")
		return
	}

	// 3. Отправляем уведомления через WebSocket
	broadcastToUser(in.ClinicID, "visit_started", map[string]interface{}{
		"visitId":    visitID,
		"employeeId": in.EmployeeID,
	})

	jsonResponse(w, http.StatusCreated, map[string]interface{}{"id": visitID})
}

func listVisitsHandler(w http.ResponseWriter, r *http.Request) {
	clinicID := r.URL.Query().Get("clinicId")
	doctorID := r.URL.Query().Get("doctorId")
	employeeID := r.URL.Query().Get("employeeId")

	log.Printf("DEBUG listVisits: clinicID=%s, doctorID=%s, employeeID=%s", clinicID, doctorID, employeeID)

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	// 0. Очищаем старые визиты (миграция данных)
	db.Exec(ctx, `UPDATE employee_visits SET route_sheet = '[]'::jsonb WHERE route_sheet IS NULL`)
	db.Exec(ctx, `UPDATE employee_visits SET employee_name = 'Пациент ' || employee_id WHERE employee_name IS NULL`)
	db.Exec(ctx, `UPDATE employee_visits SET client_name = 'Организация' WHERE client_name IS NULL`)

	// Проверяем, сколько всего визитов в базе (для отладки)
	var totalVisitsCount int
	db.QueryRow(ctx, "SELECT COUNT(*) FROM employee_visits").Scan(&totalVisitsCount)
	log.Printf("DEBUG listVisits: Total visits in database: %d", totalVisitsCount)
	if clinicID != "" {
		var clinicVisitsCount int
		db.QueryRow(ctx, "SELECT COUNT(*) FROM employee_visits WHERE clinic_id = $1", clinicID).Scan(&clinicVisitsCount)
		log.Printf("DEBUG listVisits: Visits for clinicId=%s: %d", clinicID, clinicVisitsCount)
	}

	query := `SELECT id, employee_id, employee_name, client_name, contract_id, clinic_id, visit_date, status, route_sheet, check_in_time FROM employee_visits WHERE 1=1`
	args := []interface{}{}
	argIdx := 1

	if clinicID != "" {
		query += fmt.Sprintf(" AND clinic_id = $%d", argIdx)
		args = append(args, clinicID)
		argIdx++
	}
	if employeeID != "" {
		query += fmt.Sprintf(" AND employee_id = $%d", argIdx)
		args = append(args, employeeID)
		argIdx++
	}

	query += " ORDER BY created_at DESC"
	log.Printf("DEBUG listVisits: SQL query=%s, args=%v", query, args)

	rows, err := db.Query(ctx, query, args...)
	if err != nil {
		log.Printf("ERROR listVisits: query failed: %v", err)
		errorResponse(w, http.StatusInternalServerError, "db error")
		return
	}
	defer rows.Close()

	var res []map[string]interface{}
	totalRows := 0
	for rows.Next() {
		totalRows++
		var id int64
		var contractID *int64
		var employeeID, clinicID, status string
		var employeeName, clientName *string
		var visitDate time.Time
		var routeSheet []byte
		var checkInTime *time.Time

		err := rows.Scan(&id, &employeeID, &employeeName, &clientName, &contractID, &clinicID, &visitDate, &status, &routeSheet, &checkInTime)
		if err != nil {
			log.Printf("Scan visit error: %v", err)
			continue
		}

		// Безопасно разыменовываем имя сотрудника
		empName := ""
		if employeeName != nil {
			empName = *employeeName
		}

		// Безопасно разыменовываем название организации
		orgName := ""
		if clientName != nil {
			orgName = *clientName
		}

		// Безопасно разыменовываем ID контракта
		cID := int64(0)
		if contractID != nil {
			cID = *contractID
		}

		item := map[string]interface{}{
			"id":           id,
			"employeeId":   employeeID,
			"employeeName": empName,
			"clientName":   orgName,
			"contractId":   cID,
			"clinicId":     clinicID,
			"visitDate":    visitDate.Format("2006-01-02"),
			"status":       status,
			"routeSheet":   json.RawMessage(routeSheet),
			"checkInTime":  checkInTime,
		}

		// Если фильтруем по врачу, проверяем есть ли он в маршрутном листе
		if doctorID != "" {
			var rs []map[string]interface{}
			if err := json.Unmarshal(routeSheet, &rs); err != nil {
				log.Printf("ERROR listVisits: Error unmarshaling routeSheet for visit %d: %v, routeSheet=%s", id, err, string(routeSheet))
				continue
			}
			found := false

			// Очищаем doctorID (специальность) для надежного сравнения
			// Убираем все не-буквенные и не-цифровые символы для нормализации
			cleanDoctorID := strings.ToLower(strings.TrimSpace(doctorID))
			cleanDoctorID = strings.ReplaceAll(cleanDoctorID, "врач-", "")
			cleanDoctorID = strings.ReplaceAll(cleanDoctorID, "врач", "")
			cleanDoctorID = strings.TrimSpace(cleanDoctorID)

			log.Printf("DEBUG listVisits: Checking visit %d for doctorID=%s (cleaned: %s), routeSheet has %d steps", id, doctorID, cleanDoctorID, len(rs))

			for idx, step := range rs {
				stepSpec, ok := step["specialty"].(string)
				if !ok || stepSpec == "" {
					log.Printf("DEBUG listVisits: Step %d has no specialty (type=%v, value=%v)", idx, step["type"], stepSpec)
					continue
				}

				// Нормализуем специальность из маршрутного листа
				cleanStepSpec := strings.ToLower(strings.TrimSpace(stepSpec))
				cleanStepSpec = strings.ReplaceAll(cleanStepSpec, "врач-", "")
				cleanStepSpec = strings.ReplaceAll(cleanStepSpec, "врач", "")
				cleanStepSpec = strings.TrimSpace(cleanStepSpec)

				// Также получаем doctorId из step, если он есть (может быть числом или строкой)
				var stepDoctorIDStr string
				if stepDoctorID, hasDoctorID := step["doctorId"]; hasDoctorID && stepDoctorID != nil {
					// Преобразуем doctorId в строку (может быть число или строка в JSON)
					stepDoctorIDStr = fmt.Sprintf("%v", stepDoctorID)
				}

				log.Printf("DEBUG listVisits: Step %d: specialty=%s (cleaned: %s), doctorId=%s, comparing specialty with %s", idx, stepSpec, cleanStepSpec, stepDoctorIDStr, cleanDoctorID)

				// Сравниваем специальности (прямое совпадение или частичное)
				specialtyMatch := cleanStepSpec == cleanDoctorID || strings.Contains(cleanStepSpec, cleanDoctorID) || strings.Contains(cleanDoctorID, cleanStepSpec)

				if specialtyMatch {
					found = true
					log.Printf("DEBUG listVisits: ✓ MATCH FOUND for visit %d: stepSpec=%s (cleaned: %s) matches doctorID=%s (cleaned: %s)", id, stepSpec, cleanStepSpec, doctorID, cleanDoctorID)
					break
				}
			}
			if !found {
				log.Printf("DEBUG listVisits: ✗ No matching specialty found for visit %d, doctorID=%s (cleaned: %s) in routeSheet with %d steps", id, doctorID, cleanDoctorID, len(rs))
				continue
			}
		}

		res = append(res, item)
	}

	log.Printf("DEBUG listVisits: Found %d visits (filtered from %d total rows), returning %d results", len(res), totalRows, len(res))
	// Всегда возвращаем массив, даже если пустой
	if res == nil {
		res = []map[string]interface{}{}
	}
	jsonResponse(w, http.StatusOK, res)
}

// --- AMBULATORY CARDS HANDLERS ---

func getAmbulatoryCardHandler(w http.ResponseWriter, r *http.Request) {
	patientUID := r.URL.Query().Get("patientUid")
	iin := r.URL.Query().Get("iin")

	if patientUID == "" && iin == "" {
		errorResponse(w, http.StatusBadRequest, "patientUid or iin is required")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	var card AmbulatoryCard
	var general, medical, spec, labs, final, comm []byte
	var createdAt, updatedAt time.Time

	query := `SELECT id, patient_uid, iin, general, medical, specialist_entries, lab_results, final_conclusion, communication, patient_instruction, created_at, updated_at 
	          FROM ambulatory_cards WHERE `
	var arg any
	if patientUID != "" {
		query += "patient_uid = $1"
		arg = patientUID
	} else {
		query += "iin = $1"
		arg = iin
	}

	err := db.QueryRow(ctx, query, arg).Scan(
		&card.ID, &card.PatientUID, &card.IIN, &general, &medical, &spec, &labs, &final, &comm, &card.Instr, &createdAt, &updatedAt,
	)

	if err != nil {
		// Если не найдено, это не ошибка, просто возвращаем null
		jsonResponse(w, http.StatusOK, nil)
		return
	}

	card.General = json.RawMessage(general)
	card.Medical = json.RawMessage(medical)
	card.Spec = json.RawMessage(spec)
	card.Labs = json.RawMessage(labs)
	card.Final = json.RawMessage(final)
	card.Comm = json.RawMessage(comm)
	card.CreatedAt = createdAt.Format(time.RFC3339)
	card.UpdatedAt = updatedAt.Format(time.RFC3339)

	jsonResponse(w, http.StatusOK, card)
}

func upsertAmbulatoryCardHandler(w http.ResponseWriter, r *http.Request) {
	var in AmbulatoryCard
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		errorResponse(w, http.StatusBadRequest, "invalid json")
		return
	}

	if in.PatientUID == "" && in.IIN == "" {
		errorResponse(w, http.StatusBadRequest, "iin or patientUid are required")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	// Используем ON CONFLICT для обновления если уже существует
	_, err := db.Exec(ctx, `
		INSERT INTO ambulatory_cards (patient_uid, iin, general, medical, specialist_entries, lab_results, final_conclusion, communication, patient_instruction, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
		ON CONFLICT (patient_uid) DO UPDATE SET
			iin = EXCLUDED.iin,
			general = EXCLUDED.general,
			medical = EXCLUDED.medical,
			specialist_entries = EXCLUDED.specialist_entries,
			lab_results = EXCLUDED.lab_results,
			final_conclusion = EXCLUDED.final_conclusion,
			communication = EXCLUDED.communication,
			patient_instruction = EXCLUDED.patient_instruction,
			updated_at = NOW()
	`, in.PatientUID, in.IIN, in.General, in.Medical, in.Spec, in.Labs, in.Final, in.Comm, in.Instr)

	if err != nil {
		log.Printf("upsertAmbulatoryCard error: %v", err)
		errorResponse(w, http.StatusInternalServerError, "db error")
		return
	}

	// АВТОМАТИЧЕСКАЯ ОТМЕТКА В МАРШРУТНОМ ЛИСТЕ
	if in.Spec != nil {
		var entries map[string]interface{}
		if err := json.Unmarshal(in.Spec, &entries); err == nil {
			for specialty := range entries {
				log.Printf("Updating route sheet for employee %s, specialty: %s", in.PatientUID, specialty)

				// Более надежный запрос обновления элемента в JSONB массиве
				res, err := db.Exec(ctx, `
					UPDATE employee_visits 
					SET 
						route_sheet = (
							SELECT jsonb_agg(
								CASE 
									WHEN LOWER(TRIM(item->>'specialty')) = LOWER(TRIM($1)) 
									THEN item || jsonb_build_object('status', 'completed', 'completedAt', NOW())
									ELSE item 
								END
							)
							FROM jsonb_array_elements(route_sheet) AS item
						),
						status = CASE WHEN status = 'registered' THEN 'in_progress' ELSE status END,
						updated_at = NOW()
					WHERE employee_id = $2 AND status IN ('registered', 'in_progress')
				`, specialty, in.PatientUID)

				if err != nil {
					log.Printf("Error updating route_sheet for %s: %v", specialty, err)
				} else {
					rows := res.RowsAffected()
					log.Printf("Route sheet updated, rows affected: %d", rows)
				}
			}
		}

		// Оповещаем сотрудника (по ИИН и по UUID если возможно)
		broadcastToUser(in.PatientUID, "visit_updated", map[string]interface{}{
			"employeeId": in.PatientUID,
			"status":     "updated",
		})

		// Находим UUID пользователя по ИИН для WebSocket
		var realUserID string
		_ = db.QueryRow(ctx, "SELECT id FROM users WHERE employee_id = $1 LIMIT 1", in.PatientUID).Scan(&realUserID)
		if realUserID != "" && realUserID != in.PatientUID {
			broadcastToUser(realUserID, "visit_updated", map[string]interface{}{
				"employeeId": in.PatientUID,
			})
		}

		// Оповещаем клинику
		var clinicID string
		_ = db.QueryRow(ctx, "SELECT clinic_id FROM employee_visits WHERE employee_id = $1 AND status IN ('registered', 'in_progress') LIMIT 1", in.PatientUID).Scan(&clinicID)
		if clinicID != "" {
			broadcastToUser(clinicID, "visit_updated", map[string]interface{}{
				"employeeId": in.PatientUID,
			})
		}
	}

	jsonResponse(w, http.StatusOK, map[string]string{"status": "ok"})
}

// --- MAIN ---

func main() {
	ctx := context.Background()

	var err error
	db, err = initDB(ctx)
	if err != nil {
		log.Fatalf("db init failed: %v", err)
	}
	defer db.Close()

	// Инициализация WebSocket Hub
	hub = NewHub()
	go hub.Run()

	mux := http.NewServeMux()

	// Health
	mux.HandleFunc("/health", healthHandler)

	// WebSocket
	mux.HandleFunc("/ws", wsHandler)

	// Users
	mux.HandleFunc("/api/users/by-phone", getUserByPhoneHandler)
	mux.HandleFunc("/api/users/by-bin", getUserByBinHandler)
	mux.HandleFunc("/api/users/by-uid", getUserByUidHandler)
	mux.HandleFunc("/api/users", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			createUserHandler(w, r)
			return
		}
		errorResponse(w, http.StatusMethodNotAllowed, "method not allowed")
	})

	// Visits
	mux.HandleFunc("/api/visits", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodPost:
			createVisitHandler(w, r)
		case http.MethodGet:
			listVisitsHandler(w, r)
		default:
			errorResponse(w, http.StatusMethodNotAllowed, "method not allowed")
		}
	})

	// Contracts
	mux.HandleFunc("/api/contracts", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			listContractsHandler(w, r)
		case http.MethodPost:
			createContractHandler(w, r)
		default:
			errorResponse(w, http.StatusMethodNotAllowed, "method not allowed")
		}
	})

	// Ambulatory Cards
	mux.HandleFunc("/api/ambulatory-cards", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			getAmbulatoryCardHandler(w, r)
		case http.MethodPost:
			upsertAmbulatoryCardHandler(w, r)
		default:
			errorResponse(w, http.StatusMethodNotAllowed, "method not allowed")
		}
	})

	// Doctors
	mux.HandleFunc("/api/clinics/", func(w http.ResponseWriter, r *http.Request) {
		// routes:
		// GET/POST /api/clinics/{clinicUid}/doctors
		// PUT/DELETE /api/clinics/{clinicUid}/doctors/{id}
		path := r.URL.Path
		if len(path) == 0 {
			errorResponse(w, http.StatusNotFound, "not found")
			return
		}
		if len(path) >= len("/api/clinics/") && path[len(path)-len("/doctors"):] == "/doctors" {
			switch r.Method {
			case http.MethodGet:
				listDoctorsHandler(w, r)
			case http.MethodPost:
				createDoctorHandler(w, r)
			default:
				errorResponse(w, http.StatusMethodNotAllowed, "method not allowed")
			}
			return
		}
		if len(path) > len("/api/clinics/") && pathContainsDoctorsWithID(path) {
			switch r.Method {
			case http.MethodPut:
				updateDoctorHandler(w, r)
			case http.MethodDelete:
				deleteDoctorHandler(w, r)
			default:
				errorResponse(w, http.StatusMethodNotAllowed, "method not allowed")
			}
			return
		}
		errorResponse(w, http.StatusNotFound, "not found")
	})
	mux.HandleFunc("/api/contracts/", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			getContractHandler(w, r)
			return
		}
		if r.Method == http.MethodPatch {
			updateContractHandler(w, r)
			return
		}
		errorResponse(w, http.StatusMethodNotAllowed, "method not allowed")
	})

	// Simple CORS middleware for dev (frontend on http://localhost:5173)
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Простые CORS-заголовки для локальной разработки
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Allow-Methods", "GET,POST,PATCH,PUT,DELETE,OPTIONS")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		mux.ServeHTTP(w, r)
	})

	// Настройка HTTP сервера для производительности
	server := &http.Server{
		Addr:           ":8080",
		Handler:        handler,
		ReadTimeout:    15 * time.Second, // Таймаут чтения запроса
		WriteTimeout:   15 * time.Second, // Таймаут записи ответа
		IdleTimeout:    60 * time.Second, // Таймаут простоя соединения
		MaxHeaderBytes: 1 << 20,          // Максимальный размер заголовков (1MB)
	}

	log.Printf("Go API listening on %s (optimized for concurrency)", server.Addr)
	if err := server.ListenAndServe(); err != nil {
		log.Fatalf("server error: %v", err)
	}
}

// helper to roughly detect /api/clinics/{clinicUid}/doctors/{id}
func pathContainsDoctorsWithID(path string) bool {
	// very simple check
	return len(path) > len("/api/clinics/") && len(path) > len("/doctors/") && pathContains(path, "/doctors/")
}

func pathContains(s, sub string) bool {
	return len(s) >= len(sub) && (func() bool {
		for i := 0; i <= len(s)-len(sub); i++ {
			if s[i:i+len(sub)] == sub {
				return true
			}
		}
		return false
	})()
}
