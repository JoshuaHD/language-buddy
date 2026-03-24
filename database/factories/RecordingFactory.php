<?php

namespace Database\Factories;

use App\Models\Recording;
use App\Models\Sentence;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Recording>
 */
class RecordingFactory extends Factory
{
    protected $model = Recording::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'sentence_id' => Sentence::factory(),
            'user_id' => User::factory(),
            'path' => $this->faker->filePath(),
            'options' => [],
        ];
    }
}
