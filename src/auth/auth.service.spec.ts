import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { scryptSync, randomBytes } from 'crypto';

// ── helpers ───────────────────────────────────────────────────────────────────

function makeHash(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

// ── mocks ─────────────────────────────────────────────────────────────────────

const mockJwt = { sign: jest.fn().mockReturnValue('signed-token') };

function makePrisma(userOverride: Partial<Record<string, any>> | null = {}) {
  return {
    user: {
      findUnique: jest.fn().mockResolvedValue(
        userOverride === null
          ? null
          : {
              id: 'user-uuid',
              email: 'test@example.com',
              passwordHash: makeHash('correct-password'),
              role: 'Employee',
              active: true,
              employee: { id: 'emp-uuid' },
              ...userOverride,
            },
      ),
    },
  };
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('AuthService', () => {
  let service: AuthService;
  let prisma: ReturnType<typeof makePrisma>;

  async function build(prismaMock: any) {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: JwtService, useValue: mockJwt },
      ],
    }).compile();
    service = module.get(AuthService);
  }

  beforeEach(() => jest.clearAllMocks());

  it('returns token and user profile on valid credentials', async () => {
    prisma = makePrisma();
    await build(prisma);

    const result = await service.login('test@example.com', 'correct-password');

    expect(result.token).toBe('signed-token');
    expect(result.user.email).toBe('test@example.com');
    expect(result.user.role).toBe('Employee');
    expect(mockJwt.sign).toHaveBeenCalledWith(
      expect.objectContaining({ sub: 'user-uuid', employeeId: 'emp-uuid' }),
    );
  });

  it('throws 401 when user does not exist', async () => {
    prisma = makePrisma(null);
    await build(prisma);

    await expect(service.login('unknown@example.com', 'anything')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('throws 401 when password is wrong', async () => {
    prisma = makePrisma();
    await build(prisma);

    await expect(service.login('test@example.com', 'wrong-password')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('throws 401 when user account is inactive', async () => {
    prisma = makePrisma({ active: false });
    await build(prisma);

    await expect(service.login('test@example.com', 'correct-password')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('includes null employeeId in JWT when user has no employee record', async () => {
    prisma = makePrisma({ employee: null });
    await build(prisma);

    await service.login('test@example.com', 'correct-password');

    expect(mockJwt.sign).toHaveBeenCalledWith(
      expect.objectContaining({ employeeId: null }),
    );
  });

  describe('hashPassword (static)', () => {
    it('produces a salt:hash string', () => {
      const hash = AuthService.hashPassword('mypassword');
      expect(hash).toMatch(/^[a-f0-9]{32}:[a-f0-9]{128}$/);
    });

    it('two calls produce different hashes (salt is random)', () => {
      expect(AuthService.hashPassword('same')).not.toBe(AuthService.hashPassword('same'));
    });
  });
});
