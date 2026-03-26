<?php

namespace App\Models;

use Database\Factories\LanguageFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Language extends Model
{
    /** @use HasFactory<LanguageFactory> */
    use HasFactory;

    protected $fillable = [
        'code',
        'iso3',
        'name_common',
        'name_native',
        'alt_names',
        'search_tokens',
        'search_normalized',
        'scripts',
        'regions',
        'rtl',
        'living',
    ];

    protected $casts = [
        'alt_names' => 'array',
        'search_tokens' => 'array',
        'scripts' => 'array',
        'regions' => 'array',
        'rtl' => 'boolean',
        'living' => 'boolean',
    ];

    public function sentences(): HasMany
    {
        return $this->hasMany(Sentence::class);
    }
}
