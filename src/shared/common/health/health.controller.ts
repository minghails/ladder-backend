import { Controller, Get } from '@nestjs/common';
import { HealthCheckService, HealthCheck } from '@nestjs/terminus';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { DependencyHealthIndicator } from './dependency-health.indicator';

@ApiTags('Operational Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly dependencies: DependencyHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({
    summary: 'Run readiness health checks',
    description:
      'Readiness-compatible health probe. Checks PostgreSQL, RPC block access, and projector cursor freshness. Returns 503 when any dependency is unhealthy.',
  })
  @ApiOkResponse({ description: 'Backend dependencies are healthy and ready.' })
  @ApiServiceUnavailableResponse({
    description:
      'PostgreSQL, RPC, or projector freshness is unhealthy or timed out.',
  })
  check() {
    return this.ready();
  }

  @Get('ready')
  @HealthCheck()
  @ApiOperation({
    summary: 'Run dependency readiness checks',
    description:
      'Deploy readiness probe for Railway/k8s-style platforms. Checks PostgreSQL select 1, viem getBlockNumber RPC round trip, and projector cursor lag against HEALTH_PROJECTOR_MAX_LAG_BLOCKS.',
  })
  @ApiOkResponse({ description: 'Backend is ready to receive traffic.' })
  @ApiServiceUnavailableResponse({
    description:
      'One or more readiness dependencies are unavailable, stale, or timed out.',
  })
  ready() {
    return this.health.check([() => this.dependencies.isHealthy()]);
  }

  @Get('live')
  @HealthCheck()
  @ApiOperation({
    summary: 'Run process liveness check',
    description:
      'Process-only liveness probe. Does not check PostgreSQL, RPC, or projector freshness.',
  })
  @ApiOkResponse({ description: 'Backend process is alive.' })
  live() {
    return this.health.check([]);
  }
}
