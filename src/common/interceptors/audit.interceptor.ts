import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { AuditService } from '../../audit/audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    @Inject(AuditService)
    private auditService: AuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user, body, params, query } = request;
    const action = `${method} ${url}`;
    const userId = user?.sub;

    return next.handle().pipe(
      tap((response) => {
        // Log audit entry asynchronously, don't block response
        this.auditService.log({
          userId,
          action,
          entityType: this.getEntityType(url),
          entityId: params?.id || body?.id || query?.id,
          metadata: {
            method,
            url,
            body: this.sanitizeBody(body),
            params,
            query,
          },
        }).catch((err) => {
          // Silently fail audit logging to not break the request
          console.error('Audit log error:', err);
        });
      }),
      catchError((error) => {
        // Log error as well
        this.auditService.log({
          userId,
          action: `${action} (error)`,
          entityType: this.getEntityType(url),
          entityId: params?.id || body?.id || query?.id,
          metadata: {
            error: error.message,
          },
        }).catch(() => {
          // Ignore audit errors
        });
        throw error;
      }),
    );
  }

  private getEntityType(url: string): string {
    if (url.includes('/docs')) return 'document';
    if (url.includes('/tags')) return 'tag';
    if (url.includes('/actions')) return 'action';
    if (url.includes('/webhooks')) return 'webhook';
    if (url.includes('/tasks')) return 'task';
    return 'unknown';
  }

  private sanitizeBody(body: any): any {
    if (!body) return null;
    const sanitized = { ...body };
    // Remove sensitive fields if needed
    delete sanitized.password;
    delete sanitized.token;
    return sanitized;
  }
}

