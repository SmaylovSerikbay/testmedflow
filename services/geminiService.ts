import { GoogleGenAI } from "@google/genai";
import { Employee } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Парсит неструктурированный текст в строгий формат Приложения 3.
 */
export const parseEmployeeData = async (text: string): Promise<Employee[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: text,
      config: {
        responseMimeType: "application/json",
        systemInstruction: `Ты — ИИ-ассистент для платформы медицинского комплаенса MedFlow в Казахстане.
        Твоя задача — извлечь данные о сотрудниках из текста и отформатировать их в JSON.
        
        Особое внимание удели выявлению Вредных Производственных Факторов (ВПФ) на основе должности, руководствуясь санитарными правилами и нормами РК (в т.ч. контекст приказа № ҚР ДСМ-131/2020 и Санитарных правил к объектам здравоохранения).
        
        Например:
        - "Рентгенолог" -> "Ионизирующее излучение"
        - "Водитель" -> "Шум, Вибрация, Напряженность труда"
        - "Сварщик" -> "Сварочные аэрозоли, УФ-излучение"
        
        Требуемая структура JSON (Массив объектов):
        [
          {
            "id": "generated_unique_id",
            "name": "ФИО полностью",
            "dob": "ДД.ММ.ГГГГ",
            "gender": "М" или "Ж",
            "site": "Участок/Цех",
            "position": "Должность",
            "harmfulFactor": "Список вредных факторов через запятую (на основе должности)",
            "status": "pending"
          }
        ]
        
        Если данных нет, оставляй поле пустой строкой.`,
      },
    });

    const result = JSON.parse(response.text || "[]");
    return result;

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error("Не удалось обработать данные. Проверьте формат текста.");
  }
};