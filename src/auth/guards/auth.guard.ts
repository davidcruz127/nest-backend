import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { Observable } from 'rxjs';
import { JwtPayload } from '../interfaces/jwt-payload';
import { AuthService } from '../auth.service';

@Injectable()
export class AuthGuard implements CanActivate {

  constructor(
    private jwtService: JwtService,
    private authService: AuthService
  ) {}

  async canActivate( context: ExecutionContext): Promise<boolean> {

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    // Si no tiene token, Exception
    if (!token) {
      throw new UnauthorizedException('There is no bearer token');
    }

    // Buscamos en Backend si existe el usuario
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(
        token,
        {
          secret: process.env.JWT_SEED
        }
      );

      const user = await this.authService.findUserById(payload.id)

      // No existe el usuario
      if(!user) throw new UnauthorizedException('User does not exists');
      console.log(user.isActive);
      // No esta activo el Usuario
      if(!user.isActive) throw new UnauthorizedException('User is not active')


      request['user'] = user;

      

    } catch {
      throw new UnauthorizedException('No autorizado');
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers['authorization']?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
