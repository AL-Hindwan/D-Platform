const { Project, SyntaxKind } = require("ts-morph");

async function main() {
    const project = new Project({
        tsConfigFilePath: "tsconfig.json",
    });

    const filePaths = [
        "src/services/student.service.ts",
        "src/services/trainer.service.ts",
    ];

    for (const filePath of filePaths) {
        const sourceFile = project.getSourceFile(filePath);
        if (!sourceFile) {
            console.log(`File not found: ${filePath}`);
            continue;
        }

        // Ensure import exists
        const imports = sourceFile.getImportDeclarations();
        const hasAuditImport = imports.some(imp => imp.getModuleSpecifierValue() === "./audit.service" || imp.getModuleSpecifierValue() === "../services/audit.service");
        
        if (!hasAuditImport) {
            sourceFile.addImportDeclaration({
                namedImports: ["auditService"],
                moduleSpecifier: "./audit.service"
            });
        }

        const auditConfigs = {
            "StudentService": {
                "preRegisterCourse": { action: "'CREATE'", entityName: "'Enrollment'", description: "'التسجيل المبدئي في دورة'" },
                "submitPaymentProof": { action: "'CREATE'", entityName: "'Payment'", description: "'رفع إيصال دفع لدورة'" },
                "removeFromWishlist": { action: "'DELETE'", entityName: "'Wishlist'", description: "'إزالة دورة من المفضلة'" },
                "toggleWishlist": { action: "'UPDATE'", entityName: "'Wishlist'", description: "'تعديل دورة في المفضلة'" },
                "cancelEnrollment": { action: "'CANCEL'", entityName: "'Enrollment'", description: "'إلغاء التسجيل في دورة'" },
            },
            "TrainerService": {
                "addBankAccount": { action: "'CREATE'", entityName: "'BankAccount'", description: "'إضافة حساب بنكي جديد'" },
                "updateBankAccount": { action: "'UPDATE'", entityName: "'BankAccount'", description: "'تعديل حساب بنكي'" },
                "deleteBankAccount": { action: "'DELETE'", entityName: "'BankAccount'", description: "'حذف حساب بنكي'" },
                "updateTrainerCourse": { action: "'UPDATE'", entityName: "'Course'", description: "'تعديل بيانات دورة للمدرب'" },
                "deleteCourse": { action: "'DELETE'", entityName: "'Course'", description: "'حذف دورة للمدرب'" },
                "createStudentAnnouncement": { action: "'CREATE'", entityName: "'Announcement'", description: "'إنشاء إعلان للطلاب'" },
                "updateAnnouncement": { action: "'UPDATE'", entityName: "'Announcement'", description: "'تعديل إعلان'" },
                "deleteAnnouncement": { action: "'DELETE'", entityName: "'Announcement'", description: "'حذف إعلان'" },
                "unenrollStudent": { action: "'UPDATE'", entityName: "'Enrollment'", description: "'إلغاء تسجيل طالب من قبل المدرب'" },
                "bookHall": { action: "'CREATE'", entityName: "'RoomBooking'", description: "'طلب حجز قاعة'" },
                "createCourse": { action: "'CREATE'", entityName: "'Course'", description: "'إنشاء دورة جديدة للمدرب'" },
                "updateProfile": { action: "'UPDATE'", entityName: "'TrainerProfile'", description: "'تحديث الملف الشخصي للمدرب'" },
                "changePassword": { action: "'UPDATE'", entityName: "'User'", description: "'تغيير كلمة المرور للمدرب'" },
                "resubmitBookingPayment": { action: "'CREATE'", entityName: "'Payment'", description: "'إعادة إرسال إيصال الدفع لحجز قاعة'" },
                "updateEnrollmentStatus": { action: "'UPDATE'", entityName: "'Enrollment'", description: "'تحديث حالة تسجيل طالب من قبل المدرب'" },
                "cancelBooking": { action: "'CANCEL'", entityName: "'RoomBooking'", description: "'إلغاء حجز قاعة'" },
                "cancelDirectBooking": { action: "'CANCEL'", entityName: "'RoomBooking'", description: "'إلغاء حجز قاعة مباشر'" },
                "updateSession": { action: "'UPDATE'", entityName: "'Session'", description: "'تحديث جلسة تدريبية'" },
            }
        };

        const classes = sourceFile.getClasses();
        for (const cls of classes) {
            const className = cls.getName();
            if (!auditConfigs[className]) continue;

            const methods = cls.getMethods();
            for (const method of methods) {
                const methodName = method.getName();
                const config = auditConfigs[className][methodName];
                
                if (config) {
                    const text = method.getText();
                    if (text.includes("auditService.logAction")) {
                        continue; // skip if already injected
                    }

                    const returnStatements = method.getDescendantsOfKind(SyntaxKind.ReturnStatement);
                    // Use trainerId or userId depending on the method arguments
                    let performerVar = "userId";
                    if (text.includes("trainerId: string") || text.includes("(trainerId: string")) {
                        performerVar = "trainerId";
                    } else if (!text.includes("userId: string") && !text.includes("(userId: string")) {
                        performerVar = "'system'"; // Fallback
                    }

                    const auditCode = `
        auditService.logAction({
            action: ${config.action},
            entityName: ${config.entityName},
            entityId: 'system_log',
            description: ${config.description},
            performedBy: ${performerVar}
        }).catch(e => console.error(e));
`;

                    if (returnStatements.length > 0) {
                        const lastReturn = returnStatements[returnStatements.length - 1];
                        lastReturn.replaceWithText(auditCode + "\n" + lastReturn.getText());
                    } else {
                        method.addStatements(auditCode);
                    }
                    console.log(`Added audit to ${className}.${methodName}`);
                }
            }
        }
        await sourceFile.save();
    }
}

main().catch(console.error);
