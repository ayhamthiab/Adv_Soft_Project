import { IsString, IsIn } from 'class-validator';

export class VoteReportDto {
  @IsString()
  @IsIn(['UP', 'DOWN'], { message: 'voteType must be either UP or DOWN' })
  voteType!: string;
}
