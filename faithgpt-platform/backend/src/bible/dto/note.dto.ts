import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateNoteDto {
  @ApiProperty()
  @IsString()
  verseId: string;

  @ApiProperty()
  @IsString()
  content: string;
}

export class UpdateNoteDto {
  @ApiProperty()
  @IsString()
  content: string;
}

export class NoteDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  verseId: string;

  @ApiProperty()
  content: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
