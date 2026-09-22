import { Controller } from '@nestjs/common';
import { CitiesDto } from './dto/cities.dto';
import { AnalyticsService } from './analytics.service';
import { Body, Post, Get, Param } from '@nestjs/common';

@Controller('analytics')
export class AnalyticsController {
    constructor(private service: AnalyticsService) {}

    @Post('cities')
    getCities(@Body() dto: CitiesDto) {
        return this.service.getCitiesAnalytics(dto.cities);
    }

    @Get('city/:name')
    getCity(@Param('name') name: string) {
        return this.service.getSingleCity(name);
    }
}
