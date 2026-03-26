<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('languages', function (Blueprint $table) {
            $table->id();
            $table->string('code', 10)->index();
            $table->string('iso3', 10)->unique();
            $table->string('name_common');
            $table->string('name_native')->nullable();
            $table->json('alt_names')->nullable();
            $table->json('search_tokens')->nullable();
            $table->text('search_normalized')->nullable();
            $table->json('scripts')->nullable();
            $table->json('regions')->nullable();
            $table->boolean('rtl')->default(false);
            $table->boolean('living')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('languages');
    }
};
