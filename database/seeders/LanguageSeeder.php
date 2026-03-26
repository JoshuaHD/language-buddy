<?php

namespace Database\Seeders;

use App\Models\Language;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;

class LanguageSeeder extends Seeder
{
    public function run(): void
    {
        $path = database_path('seeders/data/languages.json');

        $json = File::get($path);
        $languages = json_decode($json, true);

        foreach ($languages as $lang) {
            Language::updateOrCreate(
                ['code' => $lang['code']],
                [
                    'iso3' => $lang['iso3'],
                    'name_common' => $lang['name']['common'] ?? null,
                    'name_native' => $lang['name']['native'] ?? null,
                    'alt_names' => $lang['altNames'] ?? [],
                    'search_tokens' => $lang['search']['tokens'] ?? [],
                    'search_normalized' => $lang['search']['normalized'] ?? '',
                    'scripts' => $lang['scripts'] ?? [],
                    'regions' => $lang['regions'] ?? [],
                    'rtl' => $lang['rtl'] ?? false,
                    'living' => $lang['living'] ?? true,
                ]
            );
        }
    }
}
