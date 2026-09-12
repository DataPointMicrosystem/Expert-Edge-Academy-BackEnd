const crypto = require("crypto");
const Certificate = require("../model/certificate");
const Notification = require("../model/notification");

exports.issueForEnrollment = async (enrollment, student, course) => {
  const existing = await Certificate.findOne({ enrollment: enrollment._id });
  if (existing) return existing;

  const certificate = await Certificate.create({
    certificateId: `EEA-${Date.now()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`,
    verificationCode: crypto.randomBytes(16).toString("hex"),
    enrollment: enrollment._id,
    student: student._id,
    course: course._id,
    studentName: student.fullName,
    courseTitle: course.title,
    completionDate: new Date(),
  });

  await Notification.create({
    user: student._id,
    type: "certificate_available",
    title: "Certificate available",
    message: `Your certificate for ${course.title} is ready.`,
    data: { certificateId: certificate._id },
  });
  return certificate;
};
