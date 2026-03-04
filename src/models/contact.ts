import { Schema, model, type Model } from "mongoose";
import type { ContactDocument } from "@/types/modules/contact-admin";
import {
  CONTACT_CATEGORIES,
  CONTACT_PRIORITIES,
  CONTACT_STATUSES
} from "@/constants/enums";
import { MODEL_NAMES } from "@/constants/models";
import { CONTACT_CONFIG } from "@/constants/config";

const { CONTACT, USER } = MODEL_NAMES;

const ContactAttachmentSchema = new Schema(
  {
    originalName: { type: String, required: true, trim: true },
    fileName: { type: String, required: true, trim: true },
    mimeType: { type: String, required: true, trim: true },
    size: { type: Number, required: true },
    path: { type: String, required: true, trim: true }
  },
  { _id: false }
);

const ContactSchema = new Schema<ContactDocument>(
  {
    ticketNumber: {
      type: String,
      required: [true, "Ticket number is required"],
      unique: true,
      trim: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: USER,
      required: false,
      default: null
    },
    email: {
      type: String,
      required: false,
      trim: true,
      lowercase: true,
      default: null
    },
    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
      minlength: [
        CONTACT_CONFIG.SUBJECT_MIN_LENGTH,
        `Subject must be at least ${CONTACT_CONFIG.SUBJECT_MIN_LENGTH} characters`
      ],
      maxlength: [
        CONTACT_CONFIG.SUBJECT_MAX_LENGTH,
        `Subject must not exceed ${CONTACT_CONFIG.SUBJECT_MAX_LENGTH} characters`
      ]
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: Object.values(CONTACT_CATEGORIES)
    },
    priority: {
      type: String,
      required: [true, "Priority is required"],
      enum: Object.values(CONTACT_PRIORITIES),
      default: CONTACT_PRIORITIES.MEDIUM
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
      minlength: [
        CONTACT_CONFIG.MESSAGE_MIN_LENGTH,
        `Message must be at least ${CONTACT_CONFIG.MESSAGE_MIN_LENGTH} characters`
      ],
      maxlength: [
        CONTACT_CONFIG.MESSAGE_MAX_LENGTH,
        `Message must not exceed ${CONTACT_CONFIG.MESSAGE_MAX_LENGTH} characters`
      ]
    },
    attachments: {
      type: [ContactAttachmentSchema],
      default: []
    },
    status: {
      type: String,
      required: [true, "Status is required"],
      enum: Object.values(CONTACT_STATUSES),
      default: CONTACT_STATUSES.NEW
    },
    ipAddress: {
      type: String,
      required: false,
      default: null
    }
  },
  {
    collection: "contacts",
    timestamps: true
  }
);

ContactSchema.index({ ticketNumber: 1 }, { unique: true });
ContactSchema.index({ userId: 1 }, { sparse: true });
ContactSchema.index({ status: 1 });
ContactSchema.index({ createdAt: -1 });
ContactSchema.index({ status: 1, createdAt: -1 });

const ContactModel: Model<ContactDocument> = model<ContactDocument>(
  CONTACT,
  ContactSchema
);

export default ContactModel;
