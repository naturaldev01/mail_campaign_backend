"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var QueueService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueService = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const queue_constants_1 = require("./queue.constants");
let QueueService = QueueService_1 = class QueueService {
    queue;
    logger = new common_1.Logger(QueueService_1.name);
    constructor(queue) {
        this.queue = queue;
    }
    async enqueueMail(job) {
        const delay = job.sendAfter ? Math.max(job.sendAfter.getTime() - Date.now(), 0) : 0;
        console.log('[queue] enqueueMail', {
            messageId: job.messageId,
            email: job.email,
            campaignId: job.campaignId,
            delayMs: delay,
        });
        await this.queue.add(queue_constants_1.MAIL_QUEUE, job, { delay });
        this.logger.log(`Enqueued mail for ${job.email} (campaign ${job.campaignId})`);
    }
};
exports.QueueService = QueueService;
exports.QueueService = QueueService = QueueService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, bullmq_1.InjectQueue)(queue_constants_1.MAIL_QUEUE)),
    __metadata("design:paramtypes", [bullmq_2.Queue])
], QueueService);
//# sourceMappingURL=queues.service.js.map