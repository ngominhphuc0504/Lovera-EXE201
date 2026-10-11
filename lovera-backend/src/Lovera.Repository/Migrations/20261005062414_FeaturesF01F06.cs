using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Lovera.Repository.Migrations
{
    /// <inheritdoc />
    public partial class FeaturesF01F06 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "connection_statuses",
                columns: table => new
                {
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Kind = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    ExpectedAvailableAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_connection_statuses", x => x.UserId);
                    table.ForeignKey(
                        name: "FK_connection_statuses_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "couples",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EndedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    StartDate = table.Column<DateOnly>(type: "date", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_couples", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "pairing_invitations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatorUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    CodeHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ExpiresAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    RedeemedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CancelledAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_pairing_invitations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_pairing_invitations_users_CreatorUserId",
                        column: x => x.CreatorUserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "couple_members",
                columns: table => new
                {
                    CoupleId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    JoinedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LeftAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_couple_members", x => new { x.CoupleId, x.UserId });
                    table.ForeignKey(
                        name: "FK_couple_members_couples_CoupleId",
                        column: x => x.CoupleId,
                        principalTable: "couples",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_couple_members_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "date_plans",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CoupleId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatorUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Budget = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    EstimatedTotal = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    ScheduledAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Location = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    FoodPreference = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    ActivityPreference = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    ItemsJson = table.Column<string>(type: "jsonb", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    SavedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CompletedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_date_plans", x => x.Id);
                    table.ForeignKey(
                        name: "FK_date_plans_couples_CoupleId",
                        column: x => x.CoupleId,
                        principalTable: "couples",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "gardens",
                columns: table => new
                {
                    CoupleId = table.Column<Guid>(type: "uuid", nullable: false),
                    TotalPoints = table.Column<int>(type: "integer", nullable: false),
                    Stage = table.Column<int>(type: "integer", nullable: false),
                    LastCareAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_gardens", x => x.CoupleId);
                    table.ForeignKey(
                        name: "FK_gardens_couples_CoupleId",
                        column: x => x.CoupleId,
                        principalTable: "couples",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "memories",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CoupleId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatorUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Text = table.Column<string>(type: "character varying(5000)", maxLength: 5000, nullable: true),
                    ImageBytes = table.Column<byte[]>(type: "bytea", nullable: true),
                    ImageContentType = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_memories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_memories_couples_CoupleId",
                        column: x => x.CoupleId,
                        principalTable: "couples",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "point_events",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CoupleId = table.Column<Guid>(type: "uuid", nullable: false),
                    ActorUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    ActionType = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    Points = table.Column<int>(type: "integer", nullable: false),
                    LocalDate = table.Column<DateOnly>(type: "date", nullable: false),
                    SourceId = table.Column<Guid>(type: "uuid", nullable: true),
                    OccurredAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_point_events", x => x.Id);
                    table.ForeignKey(
                        name: "FK_point_events_couples_CoupleId",
                        column: x => x.CoupleId,
                        principalTable: "couples",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_couple_members_UserId",
                table: "couple_members",
                column: "UserId",
                unique: true,
                filter: "\"LeftAtUtc\" IS NULL");

            migrationBuilder.CreateIndex(
                name: "IX_couples_EndedAtUtc",
                table: "couples",
                column: "EndedAtUtc");

            migrationBuilder.CreateIndex(
                name: "IX_date_plans_CoupleId_CreatedAtUtc",
                table: "date_plans",
                columns: new[] { "CoupleId", "CreatedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_memories_CoupleId_CreatedAtUtc",
                table: "memories",
                columns: new[] { "CoupleId", "CreatedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_pairing_invitations_CodeHash",
                table: "pairing_invitations",
                column: "CodeHash",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_pairing_invitations_CreatorUserId_ExpiresAtUtc",
                table: "pairing_invitations",
                columns: new[] { "CreatorUserId", "ExpiresAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_point_events_CoupleId_ActionType_SourceId",
                table: "point_events",
                columns: new[] { "CoupleId", "ActionType", "SourceId" },
                unique: true,
                filter: "\"SourceId\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_point_events_CoupleId_LocalDate",
                table: "point_events",
                columns: new[] { "CoupleId", "LocalDate" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "connection_statuses");

            migrationBuilder.DropTable(
                name: "couple_members");

            migrationBuilder.DropTable(
                name: "date_plans");

            migrationBuilder.DropTable(
                name: "gardens");

            migrationBuilder.DropTable(
                name: "memories");

            migrationBuilder.DropTable(
                name: "pairing_invitations");

            migrationBuilder.DropTable(
                name: "point_events");

            migrationBuilder.DropTable(
                name: "couples");
        }
    }
}
