import { Knex } from "knex";

const syncColumn = async (knex: Knex, tableSchema: TableSchema) => {
    for (const column of tableSchema.columns) {
        const exists = await knex.schema.hasColumn(
            tableSchema.name,
            column.name
        );

        if (!exists) {
            await knex.schema.alterTable(tableSchema.name, table => {
                table[column.type](column.name)
            });

            console.log(`Added column ${column.name}`);
        }
    }
}

export async function syncTable(
    knex: Knex,
    tableSchema: TableSchema
) {
    const exists = await knex.schema.hasTable(tableSchema.name);

    if (exists) {
        console.log(`${tableSchema.name} already exists -> Skip Create`);
        syncColumn(knex, tableSchema)
        return;
    }

    await knex.schema.createTable(tableSchema.name, (table) => {

        tableSchema.columns.forEach((column: ColumnSchema) => {

            const col = table[column.type](column.name)
            col.notNullable()
        });

        table.timestamps(true, true);
    });

    console.log(`Created table: ${tableSchema.name}`);
}