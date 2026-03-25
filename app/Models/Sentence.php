<?php

namespace App\Models;

use Database\Factories\SentenceFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Sentence extends Model
{
    /** @use HasFactory<SentenceFactory> */
    use HasFactory;

    protected $fillable = ['content', 'language_id', 'user_id'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function language(): BelongsTo
    {
        return $this->belongsTo(Language::class);
    }

    public function recordings(): HasMany
    {
        return $this->hasMany(Recording::class);
    }
}
