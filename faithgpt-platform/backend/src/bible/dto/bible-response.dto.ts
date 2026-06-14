import { ApiProperty } from '@nestjs/swagger';
import { Testament } from '@prisma/client';

/** Mirrors `components/schemas/BibleVersion` in api/openapi.yaml. */
export class BibleVersionDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'ESV' })
  code: string;

  @ApiProperty({ example: 'English Standard Version' })
  name: string;

  @ApiProperty({ example: 'en' })
  language: string;

  @ApiProperty({ enum: ['PUBLIC_DOMAIN', 'LICENSED'] })
  license: string;

  @ApiProperty()
  isOfflineBundled: boolean;

  @ApiProperty({ nullable: true })
  publisher: string | null;
}

/** Mirrors `components/schemas/BibleBook` in api/openapi.yaml. */
export class BibleBookDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'Romans' })
  name: string;

  @ApiProperty({ example: 'Rom' })
  abbreviation: string;

  @ApiProperty({ enum: Testament })
  testament: Testament;

  @ApiProperty({ example: 45 })
  orderIndex: number;

  @ApiProperty({ example: 16 })
  chapterCount: number;
}

/** Mirrors `components/schemas/VerseWithText` in api/openapi.yaml. */
export class VerseWithTextDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  bookId: string;

  @ApiProperty()
  chapter: number;

  @ApiProperty()
  verse: number;

  @ApiProperty({ example: 'Romans 8:28' })
  reference: string;

  @ApiProperty({ example: 'And we know that for those who love God all things work together for good...' })
  text: string;

  @ApiProperty({ example: 'ESV' })
  versionCode: string;
}
