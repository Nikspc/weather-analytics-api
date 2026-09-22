import { ArrayNotEmpty, IsArray, IsString } from "class-validator";

export class CitiesDto{
    @IsArray()
    @ArrayNotEmpty()
    @IsString({ each: true })
    cities: string[];
}