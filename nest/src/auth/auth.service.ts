import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';

// One hardcoded pilot account, as required by the brief.
const PILOT_USERNAME = 'johndoe';
const PILOT_PASSWORD = 'susiairtest';
const TOKEN_TTL_SECONDS = 12 * 60 * 60;

@Injectable()
export class AuthService {
  constructor(private readonly jwt: JwtService) {}

  async login(dto: LoginDto) {
    if (dto.username !== PILOT_USERNAME || dto.password !== PILOT_PASSWORD) {
      throw new UnauthorizedException('Invalid username or password');
    }
    const accessToken = await this.jwt.signAsync(
      { sub: 'pilot-johndoe', username: PILOT_USERNAME },
      { expiresIn: TOKEN_TTL_SECONDS },
    );
    return {
      accessToken,
      tokenType: 'Bearer' as const,
      expiresIn: TOKEN_TTL_SECONDS,
    };
  }
}
