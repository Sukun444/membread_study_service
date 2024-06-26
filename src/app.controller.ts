import { Body, Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  async getHello(@Body() body : {hello : string}): Promise<string> {
    return await this.appService.getHello(body.hello);
  }
}
