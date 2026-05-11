import { ServiceUnavailableException } from '@nestjs/common';
import { describe, it, expect, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { HealthCheckService, TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { DependencyHealthIndicator } from './dependency-health.indicator';

type HealthIndicatorFunction = () => Promise<unknown>;

describe('HealthController', () => {
  it('should be defined', async () => {
    const module = await Test.createTestingModule({
      imports: [TerminusModule],
      controllers: [HealthController],
      providers: [
        {
          provide: DependencyHealthIndicator,
          useValue: { isHealthy: vi.fn() },
        },
      ],
    }).compile();

    const controller = module.get(HealthController);
    expect(controller).toBeDefined();
  });

  it('runs dependency indicators for /health', async () => {
    const health = {
      check: vi.fn().mockResolvedValue({ status: 'ok' }),
    };
    const dependencies = {
      isHealthy: vi.fn().mockResolvedValue({ dependencies: { status: 'up' } }),
    };
    const module = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: HealthCheckService, useValue: health },
        { provide: DependencyHealthIndicator, useValue: dependencies },
      ],
    }).compile();

    const controller = module.get(HealthController);
    await controller.check();

    expect(health.check).toHaveBeenCalledWith([expect.any(Function)]);
    const calls = health.check.mock.calls as Array<[HealthIndicatorFunction[]]>;
    expect(calls).toHaveLength(1);
    const indicator = calls[0]?.[0][0];
    if (indicator === undefined) {
      throw new Error('expected health indicator');
    }
    await indicator();
    expect(dependencies.isHealthy).toHaveBeenCalled();
  });

  it('keeps /health/ready on dependency readiness checks', async () => {
    const health = {
      check: vi.fn().mockResolvedValue({ status: 'ok' }),
    };
    const dependencies = {
      isHealthy: vi.fn().mockResolvedValue({ dependencies: { status: 'up' } }),
    };
    const module = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: HealthCheckService, useValue: health },
        { provide: DependencyHealthIndicator, useValue: dependencies },
      ],
    }).compile();

    const controller = module.get(HealthController);
    await controller.ready();

    const calls = health.check.mock.calls as Array<[HealthIndicatorFunction[]]>;
    expect(calls).toHaveLength(1);
    const indicator = calls[0]?.[0][0];
    if (indicator === undefined) {
      throw new Error('expected health indicator');
    }
    await indicator();
    expect(dependencies.isHealthy).toHaveBeenCalled();
  });

  it('keeps /health/live as a process-only liveness check', async () => {
    const health = {
      check: vi.fn().mockResolvedValue({ status: 'ok' }),
    };
    const dependencies = {
      isHealthy: vi.fn(),
    };
    const module = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: HealthCheckService, useValue: health },
        { provide: DependencyHealthIndicator, useValue: dependencies },
      ],
    }).compile();

    const controller = module.get(HealthController);
    await controller.live();

    expect(health.check).toHaveBeenCalledWith([]);
    expect(dependencies.isHealthy).not.toHaveBeenCalled();
  });

  it('returns a 503-ready exception when /health dependencies are down', async () => {
    const module = await Test.createTestingModule({
      imports: [TerminusModule],
      controllers: [HealthController],
      providers: [
        {
          provide: DependencyHealthIndicator,
          useValue: {
            isHealthy: vi.fn().mockResolvedValue({
              dependencies: {
                status: 'down',
                database: { status: 'down', reason: 'connection refused' },
              },
            }),
          },
        },
      ],
    }).compile();

    const controller = module.get(HealthController);

    await expect(controller.check()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
