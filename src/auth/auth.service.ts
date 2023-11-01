import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { User } from './entities/user.entity';
import { Model } from 'mongoose';

import * as bcryptjs from 'bcryptjs';

import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './interfaces/jwt-payload';
import { LoginResponse } from './interfaces/login-response';

// Mis DTO
import {CreateUserDto, UpdateAuthDto, LoginDto, RegisterDto } from './dto/index';

@Injectable()
export class AuthService {

  constructor(
    @InjectModel( User.name)
    private userModel: Model<User>,

    private jwtService: JwtService

  ){}

  async create(createUserDto: CreateUserDto): Promise<User> {

    try
    {
      const { password, ...userData} = createUserDto;

      const newUser = new this.userModel({
        // Encriptar la contraseña
        password: bcryptjs.hashSync(password, 10),
        ...userData
      });

    // Guardamos BD
    await newUser.save();

    // Eliminamos el valor password del objeto
    const {password:_, ...user} = newUser.toJSON();

    return user;

    }catch(error){
      if ( error.code === 11000){
        throw new BadRequestException(`${ createUserDto.email} already exists!`);
      }
      throw new InternalServerErrorException('Something terrible happen!')
    }

  }

  async register(registerDto: RegisterDto): Promise<LoginResponse> {

    const user = await this.create(registerDto);

    return {
      user: user,
      token: this.getJwtToken({id: user._id})
    }

  }

  async login(loginDto: LoginDto):Promise<LoginResponse> {

    const { email, password} = loginDto;


    // Buscamos Email existe
    const user = await this.userModel.findOne({email});

    // Si no existe el usuario
    if (!user){
      throw new UnauthorizedException('Not valid credentials - email')
    }

    // Comprobamos la contraseña
    if (!bcryptjs.compareSync(password, user.password)){
      throw new UnauthorizedException('Not valid credentials - password')
    }

    const { password:_, ...rest} = user.toJSON();

    // Devolvemos el objeto
    return {
      user: rest,
      token: this.getJwtToken({ id: user.id }),
    }

  }

  findAll(): Promise<User[]> {
    return this.userModel.find();
  }

  async findUserById(id: string){
    const user = await this.userModel.findById(id);
    const {password, ...rest} = user.toJSON();

    return rest;
  }

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }

  update(id: number, updateAuthDto: UpdateAuthDto) {
    return `This action updates a #${id} auth`;
  }

  remove(id: number) {
    return `This action removes a #${id} auth`;
  }

  // Función que devuelve el token de session
  getJwtToken(payload: JwtPayload){

    const token = this.jwtService.sign(payload);

    return token;

  }
}