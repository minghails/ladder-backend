import { Module } from '@nestjs/common';
import { ChainProjectorService } from './chain-projector.service';

@Module({
  providers: [ChainProjectorService],
  exports: [ChainProjectorService],
})
export class ChainProjectorModule {}
