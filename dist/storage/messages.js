import { messages, users } from '../schema.js';
import { and, asc, eq, or } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
export class MessageStorage {
    constructor(db) {
        this.db = db;
    }
    async getMessage(id) {
        const senderAlias = alias(users, 'sender');
        const receiverAlias = alias(users, 'receiver');
        const [result] = await this.db
            .select({
            id: messages.id,
            content: messages.content,
            senderId: messages.senderId,
            receiverId: messages.receiverId,
            sharedPostId: messages.sharedPostId,
            isRead: messages.isRead,
            createdAt: messages.createdAt,
            sender: senderAlias,
            receiver: receiverAlias
        })
            .from(messages)
            .leftJoin(senderAlias, eq(messages.senderId, senderAlias.id))
            .leftJoin(receiverAlias, eq(messages.receiverId, receiverAlias.id))
            .where(eq(messages.id, id));
        if (!result)
            return undefined;
        return {
            id: result.id,
            content: result.content,
            senderId: result.senderId,
            receiverId: result.receiverId,
            sharedPostId: result.sharedPostId,
            isRead: result.isRead,
            createdAt: result.createdAt,
            updatedAt: result.updatedAt,
            messageType: result.messageType,
            sender: result.sender || {
                id: '',
                email: '',
                firstName: '',
                userType: 'general',
                isVerified: false,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            receiver: result.receiver || {
                id: '',
                email: '',
                firstName: '',
                userType: 'general',
                isVerified: false,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        };
    }
    async getMessages(filters) {
        const senderAlias = alias(users, 'sender');
        const receiverAlias = alias(users, 'receiver');
        let query = this.db
            .select({
            id: messages.id,
            content: messages.content,
            senderId: messages.senderId,
            receiverId: messages.receiverId,
            sharedPostId: messages.sharedPostId,
            isRead: messages.isRead,
            createdAt: messages.createdAt,
            sender: senderAlias,
            receiver: receiverAlias
        })
            .from(messages)
            .leftJoin(senderAlias, eq(messages.senderId, senderAlias.id))
            .leftJoin(receiverAlias, eq(messages.receiverId, receiverAlias.id));
        const conditions = [];
        if (filters.senderId) {
            conditions.push(eq(messages.senderId, filters.senderId));
        }
        if (filters.receiverId) {
            conditions.push(eq(messages.receiverId, filters.receiverId));
        }
        const finalQuery = conditions.length > 0 ? query.where(and(...conditions)) : query;
        const results = await finalQuery;
        return results.map((result) => ({
            id: result.id,
            content: result.content,
            senderId: result.senderId,
            receiverId: result.receiverId,
            sharedPostId: result.sharedPostId,
            isRead: result.isRead,
            createdAt: result.createdAt,
            updatedAt: new Date(),
            messageType: result.messageType || 'text',
            sender: result.sender || {
                id: '',
                email: '',
                firstName: null,
                lastName: null,
                profileImageUrl: null,
                coverImageUrl: null,
                userType: 'general',
                bio: null,
                city: null,
                address: null,
                phone: null,
                website: null,
                socialMedia: null,
                isVerified: false,
                isActive: true,
                lastLogin: null,
                emailVerified: false,
                phoneVerified: false,
                preferences: null,
                metadata: null,
                createdAt: null,
                updatedAt: null
            },
            receiver: result.receiver || {
                id: '',
                email: '',
                firstName: null,
                lastName: null,
                profileImageUrl: null,
                coverImageUrl: null,
                userType: 'general',
                bio: null,
                city: null,
                address: null,
                phone: null,
                website: null,
                socialMedia: null,
                isVerified: false,
                isActive: true,
                lastLogin: null,
                emailVerified: false,
                phoneVerified: false,
                preferences: null,
                metadata: null,
                createdAt: null,
                updatedAt: null
            }
        }));
    }
    async getUserMessages(userId) {
        const senderAlias = alias(users, 'sender');
        const receiverAlias = alias(users, 'receiver');
        const results = await this.db
            .select({
            id: messages.id,
            content: messages.content,
            senderId: messages.senderId,
            receiverId: messages.receiverId,
            sharedPostId: messages.sharedPostId,
            isRead: messages.isRead,
            createdAt: messages.createdAt,
            sender: senderAlias,
            receiver: receiverAlias
        })
            .from(messages)
            .leftJoin(senderAlias, eq(messages.senderId, senderAlias.id))
            .leftJoin(receiverAlias, eq(messages.receiverId, receiverAlias.id))
            .where(or(eq(messages.senderId, userId), eq(messages.receiverId, userId)))
            .orderBy(asc(messages.createdAt));
        return results.map((result) => ({
            id: result.id,
            content: result.content,
            senderId: result.senderId,
            receiverId: result.receiverId,
            sharedPostId: result.sharedPostId,
            isRead: result.isRead,
            createdAt: result.createdAt,
            updatedAt: new Date(),
            messageType: result.messageType || 'text',
            sender: result.sender || {
                id: '',
                email: '',
                firstName: null,
                lastName: null,
                profileImageUrl: null,
                coverImageUrl: null,
                userType: 'general',
                bio: null,
                city: null,
                address: null,
                phone: null,
                website: null,
                socialMedia: null,
                isVerified: false,
                isActive: true,
                lastLogin: null,
                emailVerified: false,
                phoneVerified: false,
                preferences: null,
                metadata: null,
                createdAt: null,
                updatedAt: null
            },
            receiver: result.receiver || {
                id: '',
                email: '',
                firstName: null,
                lastName: null,
                profileImageUrl: null,
                coverImageUrl: null,
                userType: 'general',
                bio: null,
                city: null,
                address: null,
                phone: null,
                website: null,
                socialMedia: null,
                isVerified: false,
                isActive: true,
                lastLogin: null,
                emailVerified: false,
                phoneVerified: false,
                preferences: null,
                metadata: null,
                createdAt: null,
                updatedAt: null
            }
        }));
    }
    async getConversation(userId1, userId2) {
        const senderAlias = alias(users, 'sender');
        const receiverAlias = alias(users, 'receiver');
        const results = await this.db
            .select({
            id: messages.id,
            content: messages.content,
            senderId: messages.senderId,
            receiverId: messages.receiverId,
            sharedPostId: messages.sharedPostId,
            isRead: messages.isRead,
            createdAt: messages.createdAt,
            sender: senderAlias,
            receiver: receiverAlias
        })
            .from(messages)
            .leftJoin(senderAlias, eq(messages.senderId, senderAlias.id))
            .leftJoin(receiverAlias, eq(messages.receiverId, receiverAlias.id))
            .where(or(and(eq(messages.senderId, userId1), eq(messages.receiverId, userId2)), and(eq(messages.senderId, userId2), eq(messages.receiverId, userId1))))
            .orderBy(asc(messages.createdAt));
        return results.map((result) => ({
            id: result.id,
            content: result.content,
            senderId: result.senderId,
            receiverId: result.receiverId,
            sharedPostId: result.sharedPostId,
            isRead: result.isRead,
            createdAt: result.createdAt,
            updatedAt: new Date(),
            messageType: result.messageType || 'text',
            sender: result.sender || {
                id: '',
                email: '',
                firstName: null,
                lastName: null,
                profileImageUrl: null,
                coverImageUrl: null,
                userType: 'general',
                bio: null,
                city: null,
                address: null,
                phone: null,
                website: null,
                socialMedia: null,
                isVerified: false,
                isActive: true,
                lastLogin: null,
                emailVerified: false,
                phoneVerified: false,
                preferences: null,
                metadata: null,
                createdAt: null,
                updatedAt: null
            },
            receiver: result.receiver || {
                id: '',
                email: '',
                firstName: null,
                lastName: null,
                profileImageUrl: null,
                coverImageUrl: null,
                userType: 'general',
                bio: null,
                city: null,
                address: null,
                phone: null,
                website: null,
                socialMedia: null,
                isVerified: false,
                isActive: true,
                lastLogin: null,
                emailVerified: false,
                phoneVerified: false,
                preferences: null,
                metadata: null,
                createdAt: null,
                updatedAt: null
            }
        }));
    }
    async sendMessage(message) {
        const [result] = await this.db
            .insert(messages)
            .values({
            ...message,
            isRead: false
        })
            .returning();
        return result;
    }
}
