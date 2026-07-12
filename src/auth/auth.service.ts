import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { scryptSync, timingSafeEqual } from 'crypto';
import type { JwtPayload } from './jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  /**
   * Verifies email/password and returns a signed JWT plus the user's public profile.
   * Password must be stored as "salt:hash" produced by hashPassword() in the seed script.
   */
  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { employee: { select: { id: true } } },
    });

    if (!user || !user.active) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!this.verifyPassword(password, user.passwordHash)) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      employeeId: user.employee?.id ?? null,
    };

    const token = this.jwt.sign(payload);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.employee ? (user as any).employee?.name ?? email.split('@')[0] : email.split('@')[0],
        role: user.role,
      },
    };
  }

  // ── password helpers ──────────────────────────────────────────────────────

  /**
   * Hashes a plain-text password to "salt:hash" using scrypt (Node built-in).
   * Call this in the seed script — no extra npm packages needed.
   */
  static hashPassword(password: string): string {
    const { randomBytes, scryptSync: sync } = require('crypto') as typeof import('crypto');
    const salt = randomBytes(16).toString('hex');
    const hash = sync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
  }

  private verifyPassword(plain: string, stored: string): boolean {
    try {
      const [salt, hash] = stored.split(':');
      if (!salt || !hash) return false;
      const hashBuf = Buffer.from(hash, 'hex');
      const derived = scryptSync(plain, salt, 64);
      return timingSafeEqual(hashBuf, derived);
    } catch {
      return false;
    }
  }
}
