import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";

@Injectable()
export class ExecutionTimeInterceptor implements NestInterceptor {
  private readonly logger = new Logger();
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const start = Date.now(); // Start time
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      tap(() => {
        const executionTime = Date.now() - start;
        const url = request.route?.path || request.path; // Clean path, no query params
        let statusCode = response.statusCode;
        const statusMessage = response.statusMessage; // 'Not Modified',
        statusCode = statusMessage === "Not Modified" ? 200 : statusCode;
        const greenColour = "\x1b[32m";
        const redColour = "\x1b[31m";
        const redGreenColour = statusCode >= 200 && statusCode < 300 ? greenColour : redColour; // Green or Red
        const resetColour = "\x1b[0m"; // white color
        const yellowColour = "\x1b[33m";
        this.logger.debug(`${yellowColour}[${request.method} API] ${greenColour}${url} ${resetColour}responded with status ${redGreenColour}${statusCode}${resetColour}${statusMessage === "Not Modified" ? " (was 304)" : ""} in ${yellowColour}${executionTime}ms`);
      })
    );
  }
}
