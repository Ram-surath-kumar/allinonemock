import { api, ApiResponse } from './api';

export interface Book {
    id: string;
    isbn: string;
    title: string;
    author: string;
    publisher?: string;
    edition?: string;
    category_id?: number;
    is_reference_only: boolean;
    created_at: string;
}

export interface LibraryMember {
    id: string;
    user_id: string;
    role: string;
    status: string;
    membership_expiry?: string;
    max_books_limit: number;
    current_issued_count: number;
    total_fines_due: number;
}

export interface BookIssue {
    id: string;
    copy_id: string;
    member_id: string;
    issue_date: string;
    due_date: string;
    returned_date?: string;
    status: string;
    issued_by?: string;
}

export async function fetchBooks(filters?: Record<string, string>): Promise<Book[]> {
    try {
        const response = await api.getLibraryBooks(filters);
        if (response.error) throw new Error(response.error);
        return response.data || [];
    } catch (error) {
        console.error('Error fetching books:', error);
        throw error;
    }
}

export async function getMember(id: string): Promise<LibraryMember | null> {
    try {
        const response = await api.getLibraryMember(id);
        if (response.error) throw new Error(response.error);
        return response.data;
    } catch (error) {
        console.error('Error fetching member:', error);
        throw error;
    }
}

export async function issueBook(memberId: string, copyId: string): Promise<BookIssue> {
    try {
        const response = await api.issueLibraryBook({ member_id: memberId, copy_id: copyId });
        if (response.error) throw new Error(response.error);
        if (!response.data) throw new Error('No data returned from issue transaction');
        return response.data;
    } catch (error) {
        console.error('Error issuing book:', error);
        throw error;
    }
}

export async function returnBook(copyId: string): Promise<BookIssue> {
    try {
        const response = await api.returnLibraryBook({ copy_id: copyId });
        if (response.error) throw new Error(response.error);
        if (!response.data) throw new Error('No data returned from return transaction');
        return response.data;
    } catch (error) {
        console.error('Error returning book:', error);
        throw error;
    }
}

export async function addBook(bookData: Partial<Book>): Promise<Book> {
    try {
        const response = await api.addLibraryBook(bookData);
        if (response.error) throw new Error(response.error);
        if (!response.data) throw new Error('No data returned upon creating book');
        return response.data;
    } catch (error) {
        console.error('Error adding book:', error);
        throw error;
    }
}
