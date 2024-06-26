import { Injectable } from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { Attribute } from "src/database/entities/attribute.entity";
import { Course } from "src/database/entities/course.entity";
import { Learning } from "src/database/entities/learning.entity";
import { LearningAttribute } from "src/database/entities/learning_attribute.entity";
import { Lesson } from "src/database/entities/lesson.entity";
import { DataSource, Repository } from "typeorm";
import { CreateLessonVocabularyDTO } from "../../../dtos/create-lessons/createlessonvocabulary.dto";
import { UpdateProgressLessonVocabularyDTO } from "../../../dtos/updare-progress-lesson/updateprogresslessonvocabulary.dto";
import { CourseProgress } from "src/database/entities/course_progress.entity";
import { Participant } from "src/database/entities/participant.entity";

@Injectable()
export class VocabularyRepository extends Repository<Learning> {
    constructor(
        @InjectRepository(Course)
        private readonly courseRepository: Repository<Course>,
        @InjectRepository(Learning)
        private readonly learningRepository: Repository<Learning>,
        @InjectRepository(LearningAttribute)
        private readonly learningAttributeRepository: Repository<LearningAttribute>,
        @InjectRepository(CourseProgress)
        private readonly courseProgressRepository: Repository<CourseProgress>,
        @InjectDataSource()
        private dataSource: DataSource,
        @InjectRepository(Participant)
        private readonly participantRepository: Repository<Participant>
    ) {
        super(learningRepository.target, learningRepository.manager, learningRepository.queryRunner);
    }

    async createLesson(createLesson: CreateLessonVocabularyDTO) {
        console.log("COURSE ID :", createLesson.courseId)
        const course = await this.courseRepository.findOne({
            where: { id: createLesson.courseId }
        })

        if (!course) {
            throw new Error("Not found with id = " + createLesson.courseId);
        }

        const lesson = new Lesson();
        lesson.title = createLesson.title;
        lesson.description = createLesson.description;
        lesson.course = course;
        lesson.type = 'vocabulary';
        lesson.save();

        const learnings: Learning[] = [];
        const learning_attributes: LearningAttribute[] = [];

        const vocabulary_attr = await Attribute.findOne({ where: { id: 1 } });
        const mean_attr = await Attribute.findOne({ where: { id: 2 } });

        for (const vocabulary of createLesson.listLearning) {
            const learning = new Learning();
            learning.lesson = lesson;
            learning.type = 'vocabulary';
            learnings.push(learning);

            console.log("VOCABULARY : ", vocabulary);

            const learningVocabulary = new LearningAttribute();
            const learningMean = new LearningAttribute();

            learningVocabulary.attribute = vocabulary_attr;
            learningVocabulary.value = vocabulary.vocabulary;
            learningVocabulary.learning = learning;

            learningMean.attribute = mean_attr;
            learningMean.value = vocabulary.mean;
            learningMean.learning = learning;

            learning_attributes.push(learningVocabulary);
            learning_attributes.push(learningMean);
        }

        await this.learningRepository.save(learnings);
        await this.learningAttributeRepository.save(learning_attributes);

        return lesson;
    }

    async getStudyLesson(lesson_id: number, goal: number) {
        return await this.dataSource.createQueryBuilder(Learning, 'learning')
            .select('learning.learning_type as type,learning.id as id')
            .addSelect('learning_attribute.value as value')
            .addSelect('attribute.attribute_name as attribute')
            .addSelect('course_progress.progress as progress')
            .innerJoin('learning_attribute', 'learning_attribute', 'learning.id = learning_attribute.learning_id')
            .innerJoin('attribute', 'attribute', 'learning_attribute.attribute_id = attribute.id')
            .leftJoin('course_progress', 'course_progress', 'learning.id = course_progress.learning_id')
            .where('learning.lesson_id = ' + lesson_id + ' AND (course_progress.progress IS NULL OR course_progress.progress < 3 )')
            .orderBy('learning.id')
            .limit(goal * 2)
            .getRawMany();
    }

    public async getPracticeLesson(lesson_id: number, numberOfLearning: number) {
        return await this.dataSource.createQueryBuilder(Learning, 'learning')
            .select('learning.learning_type as type,learning.id as id')
            .addSelect('learning_attribute.value as value')
            .addSelect('attribute.attribute_name as attribute')
            .addSelect('course_progress.progress as progress')
            .innerJoin('learning_attribute', 'learning_attribute', 'learning.id = learning_attribute.learning_id')
            .innerJoin('attribute', 'attribute', 'learning_attribute.attribute_id = attribute.id')
            .leftJoin('course_progress', 'course_progress', 'learning.id = course_progress.learning_id')
            .where('learning.lesson_id = ' + lesson_id + ' AND course_progress.progress > 2 )')
            .orderBy('course_progress.id')
            .limit(numberOfLearning * 2)
            .getRawMany();
    }

    public async updateStudyLesson(updateLesson: UpdateProgressLessonVocabularyDTO) {

        const list_progress: CourseProgress[] = [];

        updateLesson.listVocabulary.forEach((voca_progress) => {
            const progress = new CourseProgress();
            progress.learningId = voca_progress.learning_id;
            progress.participantId = updateLesson.user_id;
            progress.progress = voca_progress.progress;
            progress.needToReview = voca_progress.need_to_review;
            progress.lastUpdated = new Date();
            list_progress.push(progress);
        })

        const participant = await this.participantRepository.findOne({
            where: {
                participant_id: updateLesson.user_id,
                course_id: updateLesson.course_id
            }
        })

        if (!participant) {
            return {
                "message" : `Participant with user_id ${updateLesson.user_id} and course_id ${updateLesson.course_id} not found`,
                "statusCode" : 404
            }
            
        }

        participant.last_studied = new Date();
        await this.courseProgressRepository.save(list_progress);
        await participant.save();

        return list_progress;
    }
}