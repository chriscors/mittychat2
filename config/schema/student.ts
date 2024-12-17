
  /**
  * Generated by @proofgeist/fmdapi package
  * https://github.com/proofgeist/fmdapi
  * DO NOT EDIT THIS FILE DIRECTLY. Changes may be overritten
  */
  import { z } from "zod";

  // @generated
  // prettier-ignore
  /* eslint-disable */
  export const ZStudent = z.object({
      "studentName": z.string(),
      "ID": z.string(),
      "currentGrade": z.string(),
      "currentStatus": z.string(),
      "graduationDate": z.string(),
      "PERSON::gender": z.string(),
      "PERSON::ethnicity": z.string(),
      "PERSON::dateofbirth": z.string(),
      "PERSON::race": z.string(),
      "PARTY::JSON_partyHH1Address": z.string(),
      "PARTY::dParentNames": z.string(),
      "PARTY::dParentEmails": z.string(),
      "PARTY::listRelationshipsJSON": z.string(),
      "PARTY::dEmail": z.string(),
      "currentGrade_stored": z.string(),
      "currentStatus_stored": z.string(),
      "newReturning_stored": z.string(),
      "parentIDs_stored": z.string(),
      "student_ext::_emergencyJSON": z.string(),
      "student_ext::_householdJSON": z.string(),
      "student_ext::_releaseJSON": z.string(),
      "student_ext::_siblingJSON": z.string(),
      "student_ext::_studentJSON": z.string(),
      "student_ext::_studentJSON.AcademicHistory": z.string(),
      "student_ext::_studentJSON.Med": z.string(),
      "student_ext::_update.studentAcademicHistory": z.string(),
      "student_ext::_update.studentMed": z.string(),
  });

  export type TStudent = z.infer<typeof ZStudent>;
