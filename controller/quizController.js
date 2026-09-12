const Quiz = require("../model/quiz");
const QuizAttempt = require("../model/quizAttempt");
const Enrollment = require("../model/enrollment");
const Course = require("../model/course");
const { success, failure } = require("../utils/apiResponse");
exports.create = async (req, res) => {
  const course = await Course.findOne({
    _id: req.params.courseId,
    instructor: req.user._id,
  });
  if (!course) return failure(res, 404, "Course not found", "COURSE_NOT_FOUND");
  return success(
    res,
    201,
    "Quiz created",
    await Quiz.create({
      course: course._id,
      lesson: req.body.lesson,
      title: req.body.title,
      description: req.body.description,
      passingScore: req.body.passingScore,
      maxAttempts: req.body.maxAttempts,
      questions: req.body.questions || [],
    }),
  );
};
exports.get = async (req, res) => {
  const quiz = await Quiz.findById(req.params.quizId).select(
    "-questions.correctAnswer",
  );
  if (!quiz) return failure(res, 404, "Quiz not found", "QUIZ_NOT_FOUND");
  return success(res, 200, "Quiz retrieved", quiz);
};
exports.start = async (req, res) => {
  const quiz = await Quiz.findById(req.params.quizId);
  const enrollment = await Enrollment.findOne({
    student: req.user._id,
    course: quiz?.course,
    status: { $in: ["active", "completed"] },
  });
  if (!quiz || !enrollment)
    return failure(res, 403, "Enrollment required", "QUIZ_ACCESS_DENIED");
  const attempts = await QuizAttempt.countDocuments({
    quiz: quiz._id,
    student: req.user._id,
  });
  if (quiz.maxAttempts && attempts >= quiz.maxAttempts)
    return failure(
      res,
      409,
      "Maximum attempts reached",
      "QUIZ_ATTEMPTS_EXCEEDED",
    );
  const attempt = await QuizAttempt.create({
    quiz: quiz._id,
    course: quiz.course,
    student: req.user._id,
    enrollment: enrollment._id,
  });
  return success(res, 201, "Quiz attempt started", {
    attemptId: attempt._id,
    quiz: {
      ...quiz.toObject(),
      questions: quiz.questions.map(
        ({ correctAnswer, ...question }) => question,
      ),
    },
  });
};
exports.submit = async (req, res) => {
  const attempt = await QuizAttempt.findOne({
    _id: req.params.attemptId,
    student: req.user._id,
  }).populate("quiz");
  if (!attempt || attempt.submittedAt)
    return failure(
      res,
      404,
      "Quiz attempt not found or already submitted",
      "QUIZ_ATTEMPT_INVALID",
    );
  const submitted = req.body.answers || [];
  let score = 0;
  let possible = 0;
  const answers = attempt.quiz.questions.map((question) => {
    possible += question.points;
    const provided = submitted.find(
      (answer) => String(answer.questionId) === String(question._id),
    )?.answer;
    const correct =
      String(provided ?? "")
        .trim()
        .toLowerCase() === String(question.correctAnswer).trim().toLowerCase();
    if (correct) score += question.points;
    return {
      questionId: question._id,
      answer: provided,
      correct,
      points: correct ? question.points : 0,
    };
  });
  attempt.answers = answers;
  attempt.score = score;
  attempt.percentage = possible ? Math.round((score / possible) * 100) : 0;
  attempt.passed = attempt.percentage >= attempt.quiz.passingScore;
  attempt.submittedAt = new Date();
  await attempt.save();
  return success(res, 200, "Quiz submitted", {
    attemptId: attempt._id,
    score: attempt.score,
    percentage: attempt.percentage,
    passed: attempt.passed,
  });
};
