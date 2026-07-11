CREATE TYPE "public"."channel_kind" AS ENUM('playlist', 'linear', 'show');--> statement-breakpoint
CREATE TYPE "public"."connection_status" AS ENUM('pending', 'connected', 'degraded', 'disabled');--> statement-breakpoint
CREATE TYPE "public"."provider_kind" AS ENUM('spotify', 'deezer', 'broadcast', 'r2', 'demo');--> statement-breakpoint
CREATE TYPE "public"."rotation_kind" AS ENUM('power', 'current', 'recurrent', 'gold', 'discovery');--> statement-breakpoint
CREATE TYPE "public"."run_status" AS ENUM('pending', 'running', 'validating', 'ready', 'publishing', 'published', 'failed', 'cancelled');--> statement-breakpoint
CREATE TABLE "artists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"canonical_name" text NOT NULL,
	"normalized_name" text NOT NULL,
	"aliases" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audio_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"track_id" uuid NOT NULL,
	"r2_key" text NOT NULL,
	"sha256" text NOT NULL,
	"mime_type" text NOT NULL,
	"byte_size" integer NOT NULL,
	"cue_in_ms" integer DEFAULT 0 NOT NULL,
	"cue_out_ms" integer,
	"intro_end_ms" integer,
	"outro_start_ms" integer,
	"rights_expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"member_id" uuid,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "channels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"kind" "channel_kind" NOT NULL,
	"timezone" text NOT NULL,
	"territory" text DEFAULT 'CH' NOT NULL,
	"locale" text DEFAULT 'en' NOT NULL,
	"autopilot_enabled" boolean DEFAULT true NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clock_slots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clock_version_id" uuid NOT NULL,
	"ordinal" integer NOT NULL,
	"offset_ms" integer,
	"kind" text NOT NULL,
	"intent" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"fixed_duration_ms" integer,
	"fixed_asset_id" uuid
);
--> statement-breakpoint
CREATE TABLE "clock_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"channel_id" uuid NOT NULL,
	"name" text NOT NULL,
	"version" integer NOT NULL,
	"daypart" text NOT NULL,
	"start_minute" integer NOT NULL,
	"end_minute" integer NOT NULL,
	"active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "format_profile_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"channel_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"statement" text NOT NULL,
	"profile" jsonb NOT NULL,
	"policies" jsonb NOT NULL,
	"confidence" real NOT NULL,
	"provenance" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"activated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "generation_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"channel_id" uuid NOT NULL,
	"profile_version_id" uuid NOT NULL,
	"clock_version_id" uuid,
	"status" "run_status" DEFAULT 'pending' NOT NULL,
	"idempotency_key" text NOT NULL,
	"engine_version" text NOT NULL,
	"seed" text NOT NULL,
	"input_hash" text NOT NULL,
	"catalog_watermark" timestamp with time zone NOT NULL,
	"horizon_start" timestamp with time zone NOT NULL,
	"horizon_end" timestamp with time zone NOT NULL,
	"cursor_instant" timestamp with time zone,
	"health" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"failure" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "generation_segments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"segment_index" integer NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"checksum" text NOT NULL,
	"item_count" integer NOT NULL,
	"checkpoint" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "llm_artifacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"purpose" text NOT NULL,
	"input_hash" text NOT NULL,
	"provenance" text NOT NULL,
	"model" text NOT NULL,
	"prompt_version" text NOT NULL,
	"output" jsonb NOT NULL,
	"token_usage" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"display_name" text NOT NULL,
	"avatar_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "provider_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"provider" "provider_kind" NOT NULL,
	"status" "connection_status" DEFAULT 'pending' NOT NULL,
	"external_account_id" text,
	"display_name" text NOT NULL,
	"encrypted_credentials" text,
	"capabilities" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"last_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "publications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"schedule_id" uuid NOT NULL,
	"connection_id" uuid NOT NULL,
	"status" "run_status" DEFAULT 'pending' NOT NULL,
	"revision" integer NOT NULL,
	"idempotency_key" text NOT NULL,
	"remote_object_id" text,
	"remote_snapshot_id" text,
	"cursor" integer DEFAULT 0 NOT NULL,
	"retry_at" timestamp with time zone,
	"response" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "schedule_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"schedule_id" uuid NOT NULL,
	"track_id" uuid,
	"asset_id" uuid,
	"ordinal" integer NOT NULL,
	"kind" text DEFAULT 'music' NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"effective_duration_ms" integer NOT NULL,
	"score" real,
	"score_components" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"reason_codes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"decision_trace" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"held" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"channel_id" uuid NOT NULL,
	"run_id" uuid NOT NULL,
	"revision" integer NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"activated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "track_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"track_id" uuid NOT NULL,
	"provider" "provider_kind" NOT NULL,
	"external_id" text NOT NULL,
	"playable" boolean DEFAULT true NOT NULL,
	"territory" text,
	"available_from" timestamp with time zone,
	"available_until" timestamp with time zone,
	"provider_metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tracks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"primary_artist_id" uuid NOT NULL,
	"recording_group_id" uuid NOT NULL,
	"title" text NOT NULL,
	"album" text,
	"duration_ms" integer NOT NULL,
	"bpm" real,
	"energy" real,
	"valence" real,
	"loudness" real,
	"musical_key" text,
	"era" text,
	"language" text,
	"explicit" boolean DEFAULT false NOT NULL,
	"rotation" "rotation_kind",
	"moods" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"feature_version" text,
	"feature_confidence" real,
	"metadata_provenance" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspace_members" (
	"workspace_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"role" text DEFAULT 'programmer' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workspace_members_workspace_id_member_id_pk" PRIMARY KEY("workspace_id","member_id")
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"default_timezone" text DEFAULT 'UTC' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "artists" ADD CONSTRAINT "artists_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audio_assets" ADD CONSTRAINT "audio_assets_track_id_tracks_id_fk" FOREIGN KEY ("track_id") REFERENCES "public"."tracks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channels" ADD CONSTRAINT "channels_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clock_slots" ADD CONSTRAINT "clock_slots_clock_version_id_clock_versions_id_fk" FOREIGN KEY ("clock_version_id") REFERENCES "public"."clock_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clock_slots" ADD CONSTRAINT "clock_slots_fixed_asset_id_audio_assets_id_fk" FOREIGN KEY ("fixed_asset_id") REFERENCES "public"."audio_assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clock_versions" ADD CONSTRAINT "clock_versions_channel_id_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "format_profile_versions" ADD CONSTRAINT "format_profile_versions_channel_id_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generation_runs" ADD CONSTRAINT "generation_runs_channel_id_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generation_runs" ADD CONSTRAINT "generation_runs_profile_version_id_format_profile_versions_id_fk" FOREIGN KEY ("profile_version_id") REFERENCES "public"."format_profile_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generation_runs" ADD CONSTRAINT "generation_runs_clock_version_id_clock_versions_id_fk" FOREIGN KEY ("clock_version_id") REFERENCES "public"."clock_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generation_segments" ADD CONSTRAINT "generation_segments_run_id_generation_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."generation_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "llm_artifacts" ADD CONSTRAINT "llm_artifacts_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_connections" ADD CONSTRAINT "provider_connections_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publications" ADD CONSTRAINT "publications_schedule_id_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."schedules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publications" ADD CONSTRAINT "publications_connection_id_provider_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."provider_connections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_items" ADD CONSTRAINT "schedule_items_schedule_id_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."schedules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_items" ADD CONSTRAINT "schedule_items_track_id_tracks_id_fk" FOREIGN KEY ("track_id") REFERENCES "public"."tracks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_items" ADD CONSTRAINT "schedule_items_asset_id_audio_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."audio_assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_channel_id_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_run_id_generation_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."generation_runs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "track_sources" ADD CONSTRAINT "track_sources_track_id_tracks_id_fk" FOREIGN KEY ("track_id") REFERENCES "public"."tracks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracks" ADD CONSTRAINT "tracks_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracks" ADD CONSTRAINT "tracks_primary_artist_id_artists_id_fk" FOREIGN KEY ("primary_artist_id") REFERENCES "public"."artists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "artists_workspace_name_idx" ON "artists" USING btree ("workspace_id","normalized_name");--> statement-breakpoint
CREATE UNIQUE INDEX "audio_assets_r2_key_uq" ON "audio_assets" USING btree ("r2_key");--> statement-breakpoint
CREATE INDEX "audit_events_workspace_time_idx" ON "audit_events" USING btree ("workspace_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "channels_workspace_slug_uq" ON "channels" USING btree ("workspace_id","slug");--> statement-breakpoint
CREATE INDEX "channels_workspace_idx" ON "channels" USING btree ("workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX "clock_slots_clock_ordinal_uq" ON "clock_slots" USING btree ("clock_version_id","ordinal");--> statement-breakpoint
CREATE UNIQUE INDEX "clock_channel_name_version_uq" ON "clock_versions" USING btree ("channel_id","name","version");--> statement-breakpoint
CREATE UNIQUE INDEX "format_profile_channel_version_uq" ON "format_profile_versions" USING btree ("channel_id","version");--> statement-breakpoint
CREATE UNIQUE INDEX "generation_runs_idempotency_uq" ON "generation_runs" USING btree ("channel_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "generation_runs_channel_status_idx" ON "generation_runs" USING btree ("channel_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "generation_segments_run_index_uq" ON "generation_segments" USING btree ("run_id","segment_index");--> statement-breakpoint
CREATE UNIQUE INDEX "llm_artifacts_workspace_input_uq" ON "llm_artifacts" USING btree ("workspace_id","input_hash","prompt_version");--> statement-breakpoint
CREATE UNIQUE INDEX "members_email_uq" ON "members" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "provider_connections_external_uq" ON "provider_connections" USING btree ("workspace_id","provider","external_account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "publications_connection_key_uq" ON "publications" USING btree ("connection_id","idempotency_key");--> statement-breakpoint
CREATE UNIQUE INDEX "schedule_items_schedule_ordinal_uq" ON "schedule_items" USING btree ("schedule_id","ordinal");--> statement-breakpoint
CREATE INDEX "schedule_items_schedule_time_idx" ON "schedule_items" USING btree ("schedule_id","starts_at");--> statement-breakpoint
CREATE UNIQUE INDEX "schedules_channel_revision_uq" ON "schedules" USING btree ("channel_id","revision");--> statement-breakpoint
CREATE UNIQUE INDEX "track_sources_provider_external_uq" ON "track_sources" USING btree ("provider","external_id");--> statement-breakpoint
CREATE INDEX "tracks_workspace_rotation_idx" ON "tracks" USING btree ("workspace_id","rotation");--> statement-breakpoint
CREATE INDEX "tracks_artist_idx" ON "tracks" USING btree ("primary_artist_id");--> statement-breakpoint
CREATE INDEX "tracks_recording_group_idx" ON "tracks" USING btree ("recording_group_id");--> statement-breakpoint
CREATE UNIQUE INDEX "workspaces_slug_uq" ON "workspaces" USING btree ("slug");