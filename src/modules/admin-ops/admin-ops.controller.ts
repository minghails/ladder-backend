import { Controller } from '@nestjs/common';
import { AdminOpsService } from './admin-ops.service';

@Controller('admin')
export class AdminOpsController {
  constructor(private readonly adminOps: AdminOpsService) {}
}
