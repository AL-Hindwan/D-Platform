const { Project, SyntaxKind } = require("ts-morph");

async function main() {
    const project = new Project({
        tsConfigFilePath: "tsconfig.json",
    });

    const filePaths = [
        "src/services/institute.service.ts",
        "src/services/student.service.ts",
        "src/services/trainer.service.ts",
        "src/services/admin.service.ts",
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

        // Map of Class Name -> Method Name -> Audit Config
        // We will define what each method should log
        const auditConfigs = {
            "InstituteService": {
                "updateInstituteProfile": { action: "'UPDATE'", entityName: "'Institute'", description: "'تعديل ملف المعهد'" },
                "addBankAccount": { action: "'CREATE'", entityName: "'BankAccount'", description: "'إضافة حساب بنكي جديد'" },
                "updateBankAccount": { action: "'UPDATE'", entityName: "'BankAccount'", description: "'تعديل حساب بنكي'" },
                "deleteBankAccount": { action: "'DELETE'", entityName: "'BankAccount'", description: "'حذف حساب بنكي'" },
                "createStudentAnnouncement": { action: "'CREATE'", entityName: "'Announcement'", description: "'إرسال إعلان جديد'" },
                "updateAnnouncement": { action: "'UPDATE'", entityName: "'Announcement'", description: "'تعديل إعلان'" },
                "deleteAnnouncement": { action: "'DELETE'", entityName: "'Announcement'", description: "'حذف إعلان'" },
                "deleteCourse": { action: "'DELETE'", entityName: "'Course'", description: "'حذف دورة'" },
                "changeTrainer": { action: "'UPDATE'", entityName: "'Course'", description: "'تغيير مدرب الدورة'" },
                "addInstituteStaff": { action: "'CREATE'", entityName: "'InstituteStaff'", description: "'إضافة عضو فريق عمل جديد'" },
                "removeInstituteStaff": { action: "'DELETE'", entityName: "'InstituteStaff'", description: "'حذف عضو من فريق العمل'" },
                "updateInstituteStaffStatus": { action: "'UPDATE'", entityName: "'InstituteStaff'", description: "'تحديث حالة عضو فريق العمل'" },
                "updateInstituteStaff": { action: "'UPDATE'", entityName: "'InstituteStaff'", description: "'تعديل بيانات عضو فريق العمل'" },
                "addInstituteHall": { action: "'CREATE'", entityName: "'Room'", description: "'إضافة قاعة جديدة'" },
                "updateInstituteHall": { action: "'UPDATE'", entityName: "'Room'", description: "'تعديل قاعة'" },
                "removeInstituteHall": { action: "'DELETE'", entityName: "'Room'", description: "'حذف قاعة'" },
                "updateRoomBookingStatus": { action: "'UPDATE'", entityName: "'RoomBooking'", description: "'تحديث حالة حجز قاعة'" },
                "unenrollStudent": { action: "'UPDATE'", entityName: "'Enrollment'", description: "'إلغاء تسجيل طالب'" },
                "updateCourse": { action: "'UPDATE'", entityName: "'Course'", description: "'تعديل بيانات دورة'" },
                "createCourse": { action: "'CREATE'", entityName: "'Course'", description: "'إنشاء دورة جديدة'" },
                "activatePendingMinimumCourse": { action: "'UPDATE'", entityName: "'Course'", description: "'تفعيل دورة كانت معلقة بانتظار الحد الأدنى'" },
                "updateSession": { action: "'UPDATE'", entityName: "'Session'", description: "'تعديل جلسة تدريبية'" },
                "updateEnrollmentStatus": { action: "'UPDATE'", entityName: "'Enrollment'", description: "'تحديث حالة تسجيل طالب'" },
            },
            "StudentService": {
                "updateProfile": { action: "'UPDATE'", entityName: "'User'", description: "'تحديث الملف الشخصي للطالب'" },
                "enrollInCourse": { action: "'CREATE'", entityName: "'Enrollment'", description: "'التسجيل في دورة'" },
                "cancelEnrollment": { action: "'CANCEL'", entityName: "'Enrollment'", description: "'إلغاء التسجيل في دورة'" },
                "submitPaymentReceipt": { action: "'CREATE'", entityName: "'Payment'", description: "'رفع إيصال دفع'" },
                "toggleWishlist": { action: "'UPDATE'", entityName: "'Wishlist'", description: "'تعديل قائمة المفضلة'" },
                "submitRoomBookingRequest": { action: "'CREATE'", entityName: "'RoomBooking'", description: "'طلب حجز قاعة'" },
            },
            "TrainerService": {
                "updateTrainerProfile": { action: "'UPDATE'", entityName: "'TrainerProfile'", description: "'تحديث الملف الشخصي للمدرب'" },
                "updateSession": { action: "'UPDATE'", entityName: "'Session'", description: "'تحديث جلسة تدريبية'" },
            },
            "AdminService": {
                "updateSystemSettings": { action: "'UPDATE'", entityName: "'SystemSetting'", description: "'تحديث إعدادات النظام'" },
                "suspendUser": { action: "'UPDATE'", entityName: "'User'", description: "'حظر مستخدم'" },
                "activateUser": { action: "'UPDATE'", entityName: "'User'", description: "'تفعيل مستخدم'" },
                "deleteUser": { action: "'DELETE'", entityName: "'User'", description: "'حذف مستخدم'" },
                "deleteInstitute": { action: "'DELETE'", entityName: "'Institute'", description: "'حذف معهد'" },
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
                    // Check if auditService.logAction is already called
                    const text = method.getText();
                    if (text.includes("auditService.logAction")) {
                        continue;
                    }

                    // Find the last return statement or end of the method
                    const returnStatements = method.getDescendantsOfKind(SyntaxKind.ReturnStatement);
                    
                    const auditCode = `
        auditService.logAction({
            action: ${config.action},
            entityName: ${config.entityName},
            entityId: 'system_log', // Default if ID is complex to resolve
            description: ${config.description},
            performedBy: userId
        }).catch(e => console.error(e));
`;

                    if (returnStatements.length > 0) {
                        // Insert before the LAST return statement (assuming the main success return is the last one)
                        const lastReturn = returnStatements[returnStatements.length - 1];
                        lastReturn.replaceWithText(auditCode + "\n" + lastReturn.getText());
                    } else {
                        // Insert at the end of the block
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
