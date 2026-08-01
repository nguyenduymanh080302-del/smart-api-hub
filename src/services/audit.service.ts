import db from "../config/db";
import type { AuditAction } from "../types/auditLog";

export interface AuditLogInput {
    userId: number;
    action: AuditAction;
    resource: string;
    recordId: number;
}

/** Records a successful resource mutation in the audit_logs table. */
export async function writeAuditLog({
    userId,
    action,
    resource,
    recordId,
}: AuditLogInput): Promise<void> {
    await db("audit_logs").insert({
        user_id: userId,
        action,
        resource_name: resource,
        record_id: recordId,
        timestamp: db.fn.now()
    });
}
