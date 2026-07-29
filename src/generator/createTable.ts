import { Knex } from "knex";

export async function createTable(
    knex: Knex,
    tableSchema: TableSchema
) {
    const exists = await knex.schema.hasTable(tableSchema.name);

    if (exists) {
        console.log(`${tableSchema.name} already exists -> Skip Create`);
        return;
    }

    await knex.schema.createTable(tableSchema.name, (table) => {

        tableSchema.columns.forEach((column: ColumnSchema) => {

            const col = table[column.type](column.name)

            if (column.required)
                col.notNullable();

            if (column.unique)
                col.unique();

            if (column.references) {
                col.references(column.references.column)
                    .inTable(column.references.table);
            }

        });

    });

    console.log(`Created table: ${tableSchema.name}`);
}