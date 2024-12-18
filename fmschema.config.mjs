/**
 * @type {import("@proofgeist/fmdapi/dist/utils/typegen/types.d.ts").GenerateSchemaOptions}
 */
export const config = {
  clientSuffix: "Layout",
  schemas: [
    // add your layouts and name schemas here
    // { layout: "student", schemaName: "student" },
    // { layout: "studentClass", schemaName: "studentClass" },
    // { layout: "class", schemaName: "class" },
    { layout: "api.Student", schemaName: "Student" },
    {
      layout: "api.Student.academicHistory",
      schemaName: "StudentAcademicHistory",
    },
    {
      layout: "api.Student.familialRelationships",
      schemaName: "StudentFamilialRelationship",
    },

    // repeat as needed for each schema...
    // { layout: "my_other_layout", schemaName: "MyOtherSchema" },
  ],

  // change this value to generate the files in a different directory
  path: "config/schema",
  clearOldFiles: true,
};
