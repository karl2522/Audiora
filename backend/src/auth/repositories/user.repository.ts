import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { GoogleUser } from '../interfaces/user.interface';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { googleId } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async createOrUpdate(googleUser: GoogleUser): Promise<User> {
    let user = await this.findByGoogleId(googleUser.id);

    if (user) {
      // Update existing user
      user.email = googleUser.email;
      user.name = googleUser.name;
      user.picture = googleUser.picture || null;
      user.lastLoginAt = new Date();
      return this.userRepository.save(user);
    }

    // Create new user
    user = this.userRepository.create({
      googleId: googleUser.id,
      email: googleUser.email,
      name: googleUser.name,
      picture: googleUser.picture || null,
      lastLoginAt: new Date(),
    });

    return this.userRepository.save(user);
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.userRepository.update(userId, {
      lastLoginAt: new Date(),
    });
  }
}

