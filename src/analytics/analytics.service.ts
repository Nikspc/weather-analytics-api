import { Injectable, NotFoundException} from '@nestjs/common';
import axios from 'axios';
import process from 'process';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class AnalyticsService {
    private readonly prisma = new PrismaClient();
    private readonly apikey = process.env.OPENWEATHER_API_KEY;
    private readonly base = 'https://api.openweathermap.org/data/2.5';
    
    private async fetchCurrent(city: string) {
        const res = await axios.get(`${this.base}/weather?q=${city}&appid=${this.apikey}&units=metric`);
        return {city: res.data.name, temp: res.data.main.temp, humidity: res.data.main.humidity};
    }

    async getCitiesAnalytics(cities: string[]) {
        const data = [];
        for (const c of cities) {
            try {
                const item = await this.fetchCurrent(c);
                data.push(item);
                this.prisma.weatherLog.create({ data: item }).catch((err) => console.error(`Failed to log weather data for ${c}:`, err));
            } catch (error) {
                console.error(`Failed to fetch weather data for ${c}:`, error);
            }
    }
    if (!data.length) throw new NotFoundException('No valid weather data found for the provided cities.');

    const sorted = [...data].sort((a, b) => b.temp - a.temp);
    const avg = Number((data.reduce((sum, item) => sum + item.temp, 0) / data.length).toFixed(1));

    return {
        averageTemperature: avg,
        highestTemperature: {city : sorted[0].city, temp: sorted[0].temp},
        lowestTemperature: {city : sorted[sorted.length - 1].city, temp: sorted[sorted.length - 1].temp},
        hotCities: data.filter(d => d.temp > 30).map(d => d.city),
    };
}

async getSingleCity(name:string) {
    try{
        const current = await this.fetchCurrent(name);
        const res = await axios.get(`${this.base}/forecast?q=${name}&appid=${this.apikey}&units=metric`);

        const map: Record<string, number[]> = {};
        for (const item of res.data.list) {
            const d = item.dt_txt.split(' ')[0];
            (map[d] ??=[]).push(item.main.temp);
        }

        const forecastNext5Days = Object.entries(map).slice(0, 5).map(([date, temps]) => ({
            date,
            minTemp: Math.min(...temps),
            maxTemp: Math.max(...temps),
        }));

        const maxForecastTemp = Math.max(...forecastNext5Days.map(f => f.maxTemp));

        return {
            city : current.city,
            currentTemperature: current.temp,
            humidity: current.humidity,
            forecastNext5Days,
            warning: maxForecastTemp > 35 ? 'Heatwave warning' : undefined,
        };
    } catch (error) {
        console.error(`Failed to fetch data for city ${name}:`, error);
        throw new NotFoundException('City not found');
    }
}