import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateBookmarkDto {
  @ApiProperty()
  @IsString()
  verseId: string;
}

export class BookmarkDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  verseId: string;

  @ApiProperty()
  createdAt: Date;
}
