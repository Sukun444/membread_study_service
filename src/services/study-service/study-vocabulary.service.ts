import { Injectable } from "@nestjs/common";
import { Vocabulary } from "src/dtos/vocabulary.dto";
import { LessonRepository } from "src/repositories/lesson.repository";

@Injectable()
export class StudyVocabularyService{
    constructor(
        private readonly lessonRepository : LessonRepository,
    ){}

    getLesson(lesson_id : number): Vocabulary[] {
        throw new Error("Method not implemented.");
    }
    getProgress(lesson_id : number): number {
        throw new Error("Method not implemented.");
    }
    study() : Vocabulary[] {
        throw new Error("Method not implemented.");
    }
    setGoal(): number {
        throw new Error("Method not implemented.");
    }
}
