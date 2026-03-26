<?php

namespace Database\Factories;

use App\Models\Language;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Language>
 */
class LanguageFactory extends Factory
{
    protected $model = Language::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'code' => $this->faker->unique()->languageCode(),
            'iso3' => $this->faker->unique()->lexify('???'),
            'name_common' => $this->faker->languageCode(),
            'name_native' => $this->faker->languageCode(),
            'rtl' => false,
            'living' => true,
        ];
    }
}
