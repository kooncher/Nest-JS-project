import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { IsString, MaxLength, IsNotEmpty } from 'class-validator';
import { CryptoService } from './crypto.service.js';

class EncryptRequestDto {
  @IsString()
  @MaxLength(2000)
  payload!: string;
}

class DecryptRequestDto {
  @IsString()
  @IsNotEmpty()
  data1!: string;

  @IsString()
  @IsNotEmpty()
  data2!: string;
}

type ApiResponse<T> = {
  successful: boolean;
  error_code: string;
  data: T | null;
};

@ApiTags('crypto')
@Controller()
export class CryptoController {
  constructor(private readonly svc: CryptoService) {}

  @Post('get-encrypt-data')
  @HttpCode(200)
  @ApiBody({ schema: { type: 'object', properties: { payload: { type: 'string', maxLength: 2000 } }, required: ['payload'] } })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        successful: { type: 'boolean' },
        error_code: { type: 'string' },
        data: {
          oneOf: [
            { type: 'null' },
            {
              type: 'object',
              properties: {
                data1: { type: 'string' },
                data2: { type: 'string' }
              },
              required: ['data1', 'data2']
            }
          ]
        }
      },
      required: ['successful', 'error_code', 'data']
    }
  })
  async encrypt(@Body() dto: EncryptRequestDto): Promise<ApiResponse<{ data1: string; data2: string }>> {
    const result = await this.svc.encrypt(dto.payload);
    return { successful: true, error_code: '', data: result };
  }

  @Post('get-decrypt-data')
  @HttpCode(200)
  @ApiBody({
    schema: {
      type: 'object',
      properties: { data1: { type: 'string' }, data2: { type: 'string' } },
      required: ['data1', 'data2']
    }
  })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        successful: { type: 'boolean' },
        error_code: { type: 'string' },
        data: {
          oneOf: [
            { type: 'null' },
            {
              type: 'object',
              properties: { payload: { type: 'string' } },
              required: ['payload']
            }
          ]
        }
      },
      required: ['successful', 'error_code', 'data']
    }
  })
  async decrypt(@Body() dto: DecryptRequestDto): Promise<ApiResponse<{ payload: string }>> {
    const payload = await this.svc.decrypt(dto.data1, dto.data2);
    return { successful: true, error_code: '', data: { payload } };
  }
}
