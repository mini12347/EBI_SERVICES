const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    fullname: {
        type: String,
        required: [true, "please enter name"]
    },
    email: {
        type: String,
        required: [true, "please enter email"],
        unique: true
    },
    telephone: {
        type: Number,
        required: [true, "please enter phone number"]
    },
    password: {
        type: String,
        required: [true, "please enter password"],
        minlength: 8
    },
    entreprise: {
        type: String
    },
    role: {
        type: String,
        enum: ["visitor", "admin", "client"],
        default: "visitor"
    },
    resetPasswordToken: {
        type: String
    },
    resetPasswordExpire: {
        type: Date
    },
    emailVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationToken: {
        type: String
    },
    emailVerificationExpire: {
        type: Date
    }
}, { timestamps: true });

userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model('User', userSchema);
