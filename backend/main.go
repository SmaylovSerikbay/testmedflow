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
	"time"

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
	ID         int64  `json:"id"`
	ClinicUID  string `json:"clinicUid"`
	Name       string `json:"name"`
	Specialty  string `json:"specialty"`
	Phone      string `json:"phone,omitempty"`
	IsChairman bool   `json:"isChairman"`
}

// RouteSheetEmployee represents an employee in a route sheet
type RouteSheetEmployee struct {
	EmployeeID      string  `json:"employeeId"`
	Name            string  `json:"name"`
	Position        string  `json:"position"`
	HarmfulFactor   string  `json:"harmfulFactor"`
	Status          string  `json:"status"` // pending, examined, completed
	ExaminationDate *string `json:"examinationDate,omitempty"`
}

// RouteSheet represents a doctor's route sheet
type RouteSheet struct {
	ID            int64                `json:"id"`
	DoctorID      string               `json:"doctorId"`
	ContractID    int64                `json:"contractId"`
	Specialty     *string              `json:"specialty,omitempty"`
	VirtualDoctor bool                 `json:"virtualDoctor"`
	Employees     []RouteSheetEmployee `json:"employees"`
	CreatedAt     string               `json:"createdAt"`
}

// AmbulatoryCard represents a medical card (Form 052)
type AmbulatoryCard struct {
	ID              int64          `json:"id"`
	EmployeeID      string         `json:"employeeId"`
	ContractID      int64          `json:"contractId"`
	CardNumber      *string        `json:"cardNumber,omitempty"`
	PersonalInfo    map[string]any `json:"personalInfo,omitempty"`
	Anamnesis       map[string]any `json:"anamnesis,omitempty"`
	Vitals          map[string]any `json:"vitals,omitempty"`
	LabTests        map[string]any `json:"labTests,omitempty"`
	Examinations    map[string]any `json:"examinations"`
	FinalConclusion map[string]any `json:"finalConclusion,omitempty"`
	CreatedAt       string         `json:"createdAt"`
	UpdatedAt       string         `json:"updatedAt"`
}

// --- GLOBAL STATE ---

var db *pgxpool.Pool

// --- HELPERS ---

func jsonResponse(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if v != nil {
		_ = json.NewEncoder(w).Encode(v)
	}
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
  is_chairman  BOOLEAN NOT NULL DEFAULT FALSE
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

	_, err = tx.Exec(ctx, `
CREATE TABLE IF NOT EXISTS ambulatory_cards (
  id           SERIAL PRIMARY KEY,
  employee_id  TEXT NOT NULL,
  contract_id  INTEGER NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  card_number  TEXT,
  personal_info JSONB,
  anamnesis    JSONB,
  vitals       JSONB,
  lab_tests    JSONB,
  examinations JSONB NOT NULL DEFAULT '{}'::jsonb,
  final_conclusion JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(employee_id, contract_id)
);
`)
	if err != nil {
		return nil, fmt.Errorf("migrate ambulatory_cards: %w", err)
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

	_, err = tx.Exec(ctx, `CREATE INDEX IF NOT EXISTS idx_ambulatory_cards_employee ON ambulatory_cards(employee_id);`)
	if err != nil {
		return nil, fmt.Errorf("create index ambulatory_cards_employee: %w", err)
	}

	_, err = tx.Exec(ctx, `CREATE INDEX IF NOT EXISTS idx_ambulatory_cards_contract ON ambulatory_cards(contract_id);`)
	if err != nil {
		return nil, fmt.Errorf("create index ambulatory_cards_contract: %w", err)
	}

	// Дополнительные индексы для производительности
	_, err = tx.Exec(ctx, `CREATE INDEX IF NOT EXISTS idx_users_bin ON users(bin) WHERE bin IS NOT NULL;`)
	if err != nil {
		return nil, fmt.Errorf("create index users_bin: %w", err)
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
		jsonResponse(w, http.StatusOK, map[string]any{"user": nil})
		return
	}
	u.CreatedAt = createdAt.Format(time.RFC3339)
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

	_, err := db.Exec(ctx, `
INSERT INTO users (id, role, bin, company_name, leader_name, phone, doctor_id, clinic_id, specialty, clinic_bin, employee_id, contract_id)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
ON CONFLICT (phone) DO UPDATE SET
  id = EXCLUDED.id,
  role = EXCLUDED.role,
  bin = EXCLUDED.bin,
  company_name = EXCLUDED.company_name,
  leader_name = EXCLUDED.leader_name,
  doctor_id = EXCLUDED.doctor_id,
  clinic_id = EXCLUDED.clinic_id,
  specialty = EXCLUDED.specialty,
  clinic_bin = EXCLUDED.clinic_bin,
  employee_id = EXCLUDED.employee_id,
  contract_id = EXCLUDED.contract_id
`, in.ID, in.Role, in.BIN, in.CompanyName, in.LeaderName, in.Phone, in.DoctorID, in.ClinicID, in.Specialty, in.ClinicBIN, in.EmployeeID, in.ContractID)
	if err != nil {
		log.Printf("createUser error: %v", err)
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
SELECT id, clinic_uid, name, specialty, phone, is_chairman
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
		if err := rows.Scan(&d.ID, &d.ClinicUID, &d.Name, &d.Specialty, &d.Phone, &d.IsChairman); err != nil {
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
INSERT INTO doctors (clinic_uid, name, specialty, phone, is_chairman)
VALUES ($1,$2,$3,$4,$5)
RETURNING id
`, clinicUID, in.Name, in.Specialty, in.Phone, in.IsChairman).Scan(&id)
	if err != nil {
		log.Printf("createDoctor error: %v", err)
		errorResponse(w, http.StatusInternalServerError, "db error")
		return
	}

	in.ID = id
	in.ClinicUID = clinicUID
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
SET name = $1, specialty = $2, phone = $3, is_chairman = $4
WHERE id = $5 AND clinic_uid = $6
`, in.Name, in.Specialty, in.Phone, in.IsChairman, id, clinicUID)
	if err != nil {
		log.Printf("updateDoctor error: %v", err)
		errorResponse(w, http.StatusInternalServerError, "db error")
		return
	}

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

	jsonResponse(w, http.StatusOK, map[string]string{"status": "ok"})
}

// --- ROUTE SHEETS HANDLERS ---

// GET /api/route-sheets?doctorId=...&contractId=...
func listRouteSheetsHandler(w http.ResponseWriter, r *http.Request) {
	doctorID := r.URL.Query().Get("doctorId")
	contractIDStr := r.URL.Query().Get("contractId")

	ctx := r.Context()
	var rows interface {
		Next() bool
		Scan(dest ...any) error
		Close()
	}
	var err error

	if doctorID != "" && contractIDStr != "" {
		var contractID int64
		if _, err := fmt.Sscanf(contractIDStr, "%d", &contractID); err != nil {
			errorResponse(w, http.StatusBadRequest, "invalid contractId")
			return
		}
		rows, err = db.Query(ctx, `
SELECT id, doctor_id, contract_id, specialty, virtual_doctor, employees, created_at
FROM route_sheets
WHERE doctor_id = $1 AND contract_id = $2
`, doctorID, contractID)
	} else if doctorID != "" {
		rows, err = db.Query(ctx, `
SELECT id, doctor_id, contract_id, specialty, virtual_doctor, employees, created_at
FROM route_sheets
WHERE doctor_id = $1
ORDER BY created_at DESC
`, doctorID)
	} else if contractIDStr != "" {
		var contractID int64
		if _, err := fmt.Sscanf(contractIDStr, "%d", &contractID); err != nil {
			errorResponse(w, http.StatusBadRequest, "invalid contractId")
			return
		}
		rows, err = db.Query(ctx, `
SELECT id, doctor_id, contract_id, specialty, virtual_doctor, employees, created_at
FROM route_sheets
WHERE contract_id = $1
ORDER BY created_at DESC
`, contractID)
	} else {
		// Если передан только specialty, ищем по specialty
		specialty := r.URL.Query().Get("specialty")
		if specialty != "" {
			rows, err = db.Query(ctx, `
SELECT id, doctor_id, contract_id, specialty, virtual_doctor, employees, created_at
FROM route_sheets
WHERE specialty = $1
ORDER BY created_at DESC
`, specialty)
		} else {
			errorResponse(w, http.StatusBadRequest, "doctorId, contractId, or specialty required")
			return
		}
	}

	if err != nil {
		log.Printf("listRouteSheets error: %v", err)
		errorResponse(w, http.StatusInternalServerError, "db error")
		return
	}
	defer rows.Close()

	var res []RouteSheet
	for rows.Next() {
		var rs RouteSheet
		var createdAt time.Time
		var employeesJSON []byte
		if err := rows.Scan(&rs.ID, &rs.DoctorID, &rs.ContractID, &rs.Specialty, &rs.VirtualDoctor, &employeesJSON, &createdAt); err != nil {
			log.Printf("scan route sheet: %v", err)
			continue
		}
		rs.CreatedAt = createdAt.Format(time.RFC3339)
		if err := json.Unmarshal(employeesJSON, &rs.Employees); err != nil {
			log.Printf("unmarshal employees: %v", err)
			continue
		}
		res = append(res, rs)
	}

	if res == nil {
		res = []RouteSheet{}
	}
	jsonResponse(w, http.StatusOK, res)
}

// POST /api/route-sheets
func createRouteSheetHandler(w http.ResponseWriter, r *http.Request) {
	var in RouteSheet
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		errorResponse(w, http.StatusBadRequest, "invalid json")
		return
	}

	if in.DoctorID == "" || in.ContractID == 0 {
		errorResponse(w, http.StatusBadRequest, "doctorId and contractId are required")
		return
	}

	employeesJSON, _ := json.Marshal(in.Employees)

	// Контекст с таймаутом для быстрого ответа
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	var id int64
	err := db.QueryRow(ctx, `
INSERT INTO route_sheets (doctor_id, contract_id, specialty, virtual_doctor, employees)
VALUES ($1, $2, $3, $4, $5)
ON CONFLICT (doctor_id, contract_id) DO UPDATE SET
  specialty = EXCLUDED.specialty,
  virtual_doctor = EXCLUDED.virtual_doctor,
  employees = EXCLUDED.employees
RETURNING id
`, in.DoctorID, in.ContractID, in.Specialty, in.VirtualDoctor, employeesJSON).Scan(&id)
	if err != nil {
		log.Printf("createRouteSheet error: %v", err)
		errorResponse(w, http.StatusInternalServerError, "db error")
		return
	}

	in.ID = id
	jsonResponse(w, http.StatusCreated, in)
}

// PATCH /api/route-sheets/{id}
func updateRouteSheetHandler(w http.ResponseWriter, r *http.Request) {
	var id int64
	_, err := fmt.Sscanf(r.URL.Path, "/api/route-sheets/%d", &id)
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
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	if v, ok := patch["employees"]; ok {
		b, _ := json.Marshal(v)
		_, err = db.Exec(ctx, `UPDATE route_sheets SET employees = $1 WHERE id = $2`, b, id)
		if err != nil {
			log.Printf("update employees: %v", err)
		}
	}

	jsonResponse(w, http.StatusOK, map[string]string{"status": "ok"})
}

// --- AMBULATORY CARDS HANDLERS ---

// GET /api/ambulatory-cards?employeeId=...&contractId=...
func getAmbulatoryCardHandler(w http.ResponseWriter, r *http.Request) {
	employeeID := r.URL.Query().Get("employeeId")
	contractIDStr := r.URL.Query().Get("contractId")

	log.Printf("getAmbulatoryCardHandler called: employeeId=%s, contractId=%s", employeeID, contractIDStr)

	if employeeID == "" || contractIDStr == "" {
		log.Printf("getAmbulatoryCardHandler: missing required params")
		errorResponse(w, http.StatusBadRequest, "employeeId and contractId are required")
		return
	}

	var contractID int64
	if _, err := fmt.Sscanf(contractIDStr, "%d", &contractID); err != nil {
		errorResponse(w, http.StatusBadRequest, "invalid contractId")
		return
	}

	// Контекст с таймаутом для быстрого ответа
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	// Используем LIMIT 1 на случай, если есть дубликаты (хотя UNIQUE constraint должен предотвращать это)
	row := db.QueryRow(ctx, `
SELECT id, employee_id, contract_id, card_number, personal_info, anamnesis, vitals, lab_tests, examinations, final_conclusion, created_at, updated_at
FROM ambulatory_cards
WHERE employee_id = $1 AND contract_id = $2
ORDER BY updated_at DESC
LIMIT 1
`, employeeID, contractID)

	var ac AmbulatoryCard
	var createdAt, updatedAt time.Time
	var cardNumber *string
	var personalInfoJSON, anamnesisJSON, vitalsJSON, labTestsJSON, examinationsJSON, finalConclusionJSON []byte

	if err := row.Scan(&ac.ID, &ac.EmployeeID, &ac.ContractID, &cardNumber, &personalInfoJSON, &anamnesisJSON, &vitalsJSON, &labTestsJSON, &examinationsJSON, &finalConclusionJSON, &createdAt, &updatedAt); err != nil {
		jsonResponse(w, http.StatusOK, map[string]any{"card": nil})
		return
	}

	ac.CardNumber = cardNumber
	ac.CreatedAt = createdAt.Format(time.RFC3339)
	ac.UpdatedAt = updatedAt.Format(time.RFC3339)

	if len(personalInfoJSON) > 0 {
		if err := json.Unmarshal(personalInfoJSON, &ac.PersonalInfo); err != nil {
			log.Printf("unmarshal personalInfo: %v", err)
		}
	}
	if len(anamnesisJSON) > 0 {
		if err := json.Unmarshal(anamnesisJSON, &ac.Anamnesis); err != nil {
			log.Printf("unmarshal anamnesis: %v", err)
		} else {
			log.Printf("getAmbulatoryCard: unmarshaled anamnesis, len=%d, content=%s", len(anamnesisJSON), string(anamnesisJSON))
		}
	} else {
		log.Printf("getAmbulatoryCard: anamnesisJSON is empty")
	}
	if len(vitalsJSON) > 0 {
		if err := json.Unmarshal(vitalsJSON, &ac.Vitals); err != nil {
			log.Printf("unmarshal vitals: %v", err)
		} else {
			log.Printf("getAmbulatoryCard: unmarshaled vitals, len=%d, content=%s", len(vitalsJSON), string(vitalsJSON))
		}
	} else {
		log.Printf("getAmbulatoryCard: vitalsJSON is empty")
	}
	if len(labTestsJSON) > 0 {
		if err := json.Unmarshal(labTestsJSON, &ac.LabTests); err != nil {
			log.Printf("unmarshal labTests: %v", err)
		}
	}
	if len(examinationsJSON) > 0 {
		if err := json.Unmarshal(examinationsJSON, &ac.Examinations); err != nil {
			log.Printf("unmarshal examinations: %v", err)
		}
	} else {
		// Если examinations пустой, устанавливаем пустой объект
		ac.Examinations = make(map[string]any)
	}
	if len(finalConclusionJSON) > 0 {
		if err := json.Unmarshal(finalConclusionJSON, &ac.FinalConclusion); err != nil {
			log.Printf("unmarshal finalConclusion: %v", err)
		}
	}

	log.Printf("getAmbulatoryCard: returning card id=%d, employeeId=%s, contractId=%d, hasExaminations=%v, hasAnamnesis=%v, hasVitals=%v", ac.ID, ac.EmployeeID, ac.ContractID, len(ac.Examinations) > 0, ac.Anamnesis != nil && len(ac.Anamnesis) > 0, ac.Vitals != nil && len(ac.Vitals) > 0)
	jsonResponse(w, http.StatusOK, map[string]any{"card": ac})
}

// GET /api/ambulatory-cards/by-contract?contractId=...
func listAmbulatoryCardsByContractHandler(w http.ResponseWriter, r *http.Request) {
	contractIDStr := r.URL.Query().Get("contractId")
	if contractIDStr == "" {
		errorResponse(w, http.StatusBadRequest, "contractId is required")
		return
	}

	var contractID int64
	if _, err := fmt.Sscanf(contractIDStr, "%d", &contractID); err != nil {
		errorResponse(w, http.StatusBadRequest, "invalid contractId")
		return
	}

	// Контекст с таймаутом для быстрого ответа
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	rows, err := db.Query(ctx, `
SELECT id, employee_id, contract_id, card_number, personal_info, anamnesis, vitals, lab_tests, examinations, final_conclusion, created_at, updated_at
FROM ambulatory_cards
WHERE contract_id = $1
ORDER BY created_at DESC
`, contractID)
	if err != nil {
		log.Printf("listAmbulatoryCards error: %v", err)
		errorResponse(w, http.StatusInternalServerError, "db error")
		return
	}
	defer rows.Close()

	var res []AmbulatoryCard
	for rows.Next() {
		var ac AmbulatoryCard
		var createdAt, updatedAt time.Time
		var cardNumber *string
		var personalInfoJSON, anamnesisJSON, vitalsJSON, labTestsJSON, examinationsJSON, finalConclusionJSON []byte

		if err := rows.Scan(&ac.ID, &ac.EmployeeID, &ac.ContractID, &cardNumber, &personalInfoJSON, &anamnesisJSON, &vitalsJSON, &labTestsJSON, &examinationsJSON, &finalConclusionJSON, &createdAt, &updatedAt); err != nil {
			log.Printf("scan ambulatory card: %v", err)
			continue
		}

		ac.CardNumber = cardNumber
		ac.CreatedAt = createdAt.Format(time.RFC3339)
		ac.UpdatedAt = updatedAt.Format(time.RFC3339)

		if len(personalInfoJSON) > 0 {
			if err := json.Unmarshal(personalInfoJSON, &ac.PersonalInfo); err != nil {
				log.Printf("unmarshal personalInfo: %v", err)
			}
		}
		if len(anamnesisJSON) > 0 {
			if err := json.Unmarshal(anamnesisJSON, &ac.Anamnesis); err != nil {
				log.Printf("unmarshal anamnesis: %v", err)
			}
		}
		if len(vitalsJSON) > 0 {
			if err := json.Unmarshal(vitalsJSON, &ac.Vitals); err != nil {
				log.Printf("unmarshal vitals: %v", err)
			}
		}
		if len(labTestsJSON) > 0 {
			if err := json.Unmarshal(labTestsJSON, &ac.LabTests); err != nil {
				log.Printf("unmarshal labTests: %v", err)
			}
		}
		if len(examinationsJSON) > 0 {
			if err := json.Unmarshal(examinationsJSON, &ac.Examinations); err != nil {
				log.Printf("unmarshal examinations: %v", err)
			}
		} else {
			// Если examinations пустой, устанавливаем пустой объект
			ac.Examinations = make(map[string]any)
		}
		if len(finalConclusionJSON) > 0 {
			if err := json.Unmarshal(finalConclusionJSON, &ac.FinalConclusion); err != nil {
				log.Printf("unmarshal finalConclusion: %v", err)
			}
		}

		res = append(res, ac)
	}

	if res == nil {
		res = []AmbulatoryCard{}
	}
	jsonResponse(w, http.StatusOK, res)
}

// POST /api/ambulatory-cards
func createAmbulatoryCardHandler(w http.ResponseWriter, r *http.Request) {
	var in AmbulatoryCard
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		errorResponse(w, http.StatusBadRequest, "invalid json")
		return
	}

	if in.EmployeeID == "" || in.ContractID == 0 {
		errorResponse(w, http.StatusBadRequest, "employeeId and contractId are required")
		return
	}

	personalInfoJSON, _ := json.Marshal(in.PersonalInfo)
	anamnesisJSON, _ := json.Marshal(in.Anamnesis)
	vitalsJSON, _ := json.Marshal(in.Vitals)
	labTestsJSON, _ := json.Marshal(in.LabTests)
	examinationsJSON, _ := json.Marshal(in.Examinations)
	finalConclusionJSON, _ := json.Marshal(in.FinalConclusion)

	// Контекст с таймаутом для быстрого ответа
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	var id int64
	err := db.QueryRow(ctx, `
INSERT INTO ambulatory_cards (employee_id, contract_id, card_number, personal_info, anamnesis, vitals, lab_tests, examinations, final_conclusion)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
ON CONFLICT (employee_id, contract_id) DO UPDATE SET
  card_number = EXCLUDED.card_number,
  personal_info = EXCLUDED.personal_info,
  anamnesis = EXCLUDED.anamnesis,
  vitals = EXCLUDED.vitals,
  lab_tests = EXCLUDED.lab_tests,
  examinations = EXCLUDED.examinations,
  final_conclusion = EXCLUDED.final_conclusion,
  updated_at = NOW()
RETURNING id
`, in.EmployeeID, in.ContractID, in.CardNumber, personalInfoJSON, anamnesisJSON, vitalsJSON, labTestsJSON, examinationsJSON, finalConclusionJSON).Scan(&id)
	if err != nil {
		log.Printf("createAmbulatoryCard error: %v", err)
		errorResponse(w, http.StatusInternalServerError, "db error")
		return
	}

	in.ID = id
	jsonResponse(w, http.StatusCreated, in)
}

// PATCH /api/ambulatory-cards/{id}
func updateAmbulatoryCardHandler(w http.ResponseWriter, r *http.Request) {
	var id int64
	_, err := fmt.Sscanf(r.URL.Path, "/api/ambulatory-cards/%d", &id)
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

	log.Printf("updateAmbulatoryCard: id=%d, patch keys=%v", id, func() []string {
		keys := make([]string, 0, len(patch))
		for k := range patch {
			keys = append(keys, k)
		}
		return keys
	}())

	if v, ok := patch["examinations"]; ok {
		b, _ := json.Marshal(v)
		_, err = db.Exec(ctx, `UPDATE ambulatory_cards SET examinations = $1, updated_at = NOW() WHERE id = $2`, b, id)
		if err != nil {
			log.Printf("update examinations: %v", err)
			errorResponse(w, http.StatusInternalServerError, fmt.Sprintf("failed to update examinations: %v", err))
			return
		}
	}
	if v, ok := patch["finalConclusion"]; ok {
		b, _ := json.Marshal(v)
		_, err = db.Exec(ctx, `UPDATE ambulatory_cards SET final_conclusion = $1, updated_at = NOW() WHERE id = $2`, b, id)
		if err != nil {
			log.Printf("update finalConclusion: %v", err)
			errorResponse(w, http.StatusInternalServerError, fmt.Sprintf("failed to update finalConclusion: %v", err))
			return
		}
	}
	if v, ok := patch["personalInfo"]; ok {
		b, _ := json.Marshal(v)
		_, err = db.Exec(ctx, `UPDATE ambulatory_cards SET personal_info = $1, updated_at = NOW() WHERE id = $2`, b, id)
		if err != nil {
			log.Printf("update personalInfo: %v", err)
			errorResponse(w, http.StatusInternalServerError, fmt.Sprintf("failed to update personalInfo: %v", err))
			return
		}
	}
	if v, ok := patch["labTests"]; ok {
		b, _ := json.Marshal(v)
		_, err = db.Exec(ctx, `UPDATE ambulatory_cards SET lab_tests = $1, updated_at = NOW() WHERE id = $2`, b, id)
		if err != nil {
			log.Printf("update labTests: %v", err)
			errorResponse(w, http.StatusInternalServerError, fmt.Sprintf("failed to update labTests: %v", err))
			return
		}
	}
	if v, ok := patch["anamnesis"]; ok {
		// Проверяем, что это не пустой объект
		if vMap, okMap := v.(map[string]any); okMap {
			hasData := false
			for _, val := range vMap {
				if val != nil && val != "" {
					hasData = true
					break
				}
			}
			if !hasData && len(vMap) == 0 {
				log.Printf("update anamnesis: skipping empty object")
			} else {
				b, _ := json.Marshal(v)
				log.Printf("update anamnesis: raw value=%v, json=%s", v, string(b))
				_, err = db.Exec(ctx, `UPDATE ambulatory_cards SET anamnesis = $1, updated_at = NOW() WHERE id = $2`, b, id)
				if err != nil {
					log.Printf("update anamnesis error: %v", err)
					errorResponse(w, http.StatusInternalServerError, fmt.Sprintf("failed to update anamnesis: %v", err))
					return
				}
				log.Printf("update anamnesis: success")
			}
		} else {
			b, _ := json.Marshal(v)
			log.Printf("update anamnesis: raw value=%v, json=%s", v, string(b))
			_, err = db.Exec(ctx, `UPDATE ambulatory_cards SET anamnesis = $1, updated_at = NOW() WHERE id = $2`, b, id)
			if err != nil {
				log.Printf("update anamnesis error: %v", err)
				errorResponse(w, http.StatusInternalServerError, fmt.Sprintf("failed to update anamnesis: %v", err))
				return
			}
			log.Printf("update anamnesis: success")
		}
	}
	if v, ok := patch["vitals"]; ok {
		// Проверяем, что это не пустой объект
		if vMap, okMap := v.(map[string]any); okMap {
			hasData := false
			for _, val := range vMap {
				if val != nil && val != "" {
					hasData = true
					break
				}
			}
			if !hasData && len(vMap) == 0 {
				log.Printf("update vitals: skipping empty object")
			} else {
				b, _ := json.Marshal(v)
				log.Printf("update vitals: raw value=%v, json=%s", v, string(b))
				_, err = db.Exec(ctx, `UPDATE ambulatory_cards SET vitals = $1, updated_at = NOW() WHERE id = $2`, b, id)
				if err != nil {
					log.Printf("update vitals error: %v", err)
					errorResponse(w, http.StatusInternalServerError, fmt.Sprintf("failed to update vitals: %v", err))
					return
				}
				log.Printf("update vitals: success")
			}
		} else {
			b, _ := json.Marshal(v)
			log.Printf("update vitals: raw value=%v, json=%s", v, string(b))
			_, err = db.Exec(ctx, `UPDATE ambulatory_cards SET vitals = $1, updated_at = NOW() WHERE id = $2`, b, id)
			if err != nil {
				log.Printf("update vitals error: %v", err)
				errorResponse(w, http.StatusInternalServerError, fmt.Sprintf("failed to update vitals: %v", err))
				return
			}
			log.Printf("update vitals: success")
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

	mux := http.NewServeMux()

	// Health
	mux.HandleFunc("/health", healthHandler)

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

	// Route Sheets
	mux.HandleFunc("/api/route-sheets", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			listRouteSheetsHandler(w, r)
		case http.MethodPost:
			createRouteSheetHandler(w, r)
		default:
			errorResponse(w, http.StatusMethodNotAllowed, "method not allowed")
		}
	})
	mux.HandleFunc("/api/route-sheets/", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPatch {
			updateRouteSheetHandler(w, r)
			return
		}
		errorResponse(w, http.StatusMethodNotAllowed, "method not allowed")
	})

	// Ambulatory Cards
	mux.HandleFunc("/api/ambulatory-cards", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			employeeID := r.URL.Query().Get("employeeId")
			contractID := r.URL.Query().Get("contractId")
			log.Printf("GET /api/ambulatory-cards: employeeId=%s, contractId=%s", employeeID, contractID)

			// Если есть employeeId, вызываем getAmbulatoryCardHandler (даже если есть contractId)
			// Если есть только contractId без employeeId, вызываем listAmbulatoryCardsByContractHandler
			if employeeID != "" {
				log.Printf("Routing to getAmbulatoryCardHandler")
				getAmbulatoryCardHandler(w, r)
			} else if contractID != "" {
				log.Printf("Routing to listAmbulatoryCardsByContractHandler")
				listAmbulatoryCardsByContractHandler(w, r)
			} else {
				log.Printf("No employeeId or contractId provided")
				errorResponse(w, http.StatusBadRequest, "employeeId or contractId is required")
			}
		case http.MethodPost:
			createAmbulatoryCardHandler(w, r)
		default:
			errorResponse(w, http.StatusMethodNotAllowed, "method not allowed")
		}
	})
	mux.HandleFunc("/api/ambulatory-cards/", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPatch {
			updateAmbulatoryCardHandler(w, r)
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
