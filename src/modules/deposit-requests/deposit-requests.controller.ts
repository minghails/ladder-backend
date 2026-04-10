import { Controller } from '@nestjs/common';
import { DepositRequestsService } from './deposit-requests.service';

@Controller('deposit-requests')
export class DepositRequestsController {
  constructor(private readonly depositRequests: DepositRequestsService) {}
}
