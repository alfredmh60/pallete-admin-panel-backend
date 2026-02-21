import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { getAllowedFields, parseFields } from 'src/utils/field-selection.util';


@Injectable()
export class FieldSelectionInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const fields = request.query.fields as string;
    
    if (!fields) {
      return next.handle();
    }

    // تشخیص منبع از مسیر
    const resource = request.route.path.split('/')[1];
    const allowedFields = getAllowedFields(resource);
    const selectedFields = parseFields(fields, allowedFields);

    return next.handle().pipe(
      map(data => {
        if (Array.isArray(data)) {
          return data.map(item => this.filterFields(item, selectedFields));
        }
        return this.filterFields(data, selectedFields);
      }),
    );
  }

  private filterFields(item: any, selectedFields: string[]): any {
    if (!item || selectedFields.length === 0) return item;
    
    const result: any = {};
    selectedFields.forEach(field => {
      if (item[field] !== undefined) {
        result[field] = item[field];
      }
    });
    return result;
  }
}