import { z } from 'zod';

export const DiagnosticoRipsSchema = z.object({
  codigo: z.string().min(1, "Código CIE-10 requerido"),
  descripcion: z.string().min(1, "Descripción requerida"),
  tipoDiagnosticoPrincipal: z.enum(['1', '2', '3']).optional(), // 1=Impresión, 2=Confirmado Nuevo, 3=Confirmado Repetido
});

export const ProcedimientoRipsSchema = z.object({
  codigo: z.string().min(1, "Código CUPS requerido"),
  descripcion: z.string().min(1, "Descripción requerida"),
  cantidad: z.number().int().min(1).optional(),
});

export const HistoriaClinicaSchema = z.object({
  paciente_id: z.string().uuid("ID de paciente inválido"),
  estado: z.enum(['borrador', 'cerrado', 'aclaratoria']),
  enfermedad_actual: z.string().optional(),
  motivo_consulta: z.string().optional(),
  anamnesis: z.string().optional(),
  plan_manejo: z.string().optional(),
  impresion_diagnostica: z.array(DiagnosticoRipsSchema).optional().default([]),
  procedimientos: z.array(ProcedimientoRipsSchema).optional().default([]),
  facturacion: z.record(z.string(), z.any()).optional().default({}),
  metadatos_atencion: z.record(z.string(), z.any()).optional().default({}),
  signos_vitales: z.record(z.string(), z.any()).optional().default({}),
  parent_id: z.string().uuid().optional().nullable(),
}).superRefine((data, ctx) => {
  if (data.estado === 'cerrado' && data.impresion_diagnostica.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Se requiere al menos un diagnóstico CIE-10 para cerrar la historia clínica',
      path: ['impresion_diagnostica'],
    });
  }
});

export const PacienteSchema = z.object({
  documento: z.string().min(5, "Documento inválido"),
  tipo_documento: z.enum(['CC', 'TI', 'RC', 'PA', 'CE', 'NU']).default('CC'),
  nombres: z.string().min(2, "Nombres requeridos"),
  apellidos: z.string().min(2, "Apellidos requeridos"),
  fecha_nacimiento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha YYYY-MM-DD inválido"),
  genero: z.enum(['Masculino', 'Femenino', 'Otro']).optional(),
  eps: z.string().optional(),
  prepagada: z.string().optional(),
  tipo_sangre: z.string().optional(),
  telefono: z.string().optional(),
  padre: z.string().optional(),
  telefono_padre: z.string().optional(),
  madre: z.string().optional(),
  telefono_madre: z.string().optional(),
  acompanante: z.string().optional(),
  telefono_acompanante: z.string().optional(),
});
