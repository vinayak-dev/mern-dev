const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const config = require('config');
const jwt  = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');

const User = require('../../model/User');

//@route POST api/user
//@desc Register user
//@access public
router.post('/', [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Valid email is required').isEmail(),
    check('password', 'Password should be 6 or more characters').isLength({ min : 6 })
], 
async (req,res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array()});
    }

    const { name,email,password } = req.body;

    try{
        let user = await User.findOne({ email });
        if(user)
        {
            res.status(400).json({ errors: [{msg: 'User exist'}] });
        }
        const avatar = gravatar.url(email,{
            s:'200',
            r:'pg',
            d:'mm'
        })

        user = new User({
            name,
            email,
            password,
            avatar
        });

        const salt = await bcrypt.genSalt(10);
        user.password =await bcrypt.hash(password, salt);


        await user.save();

        const payload = {
            user: {
                id: user.id
            }
        };
        jwt.sign(
            payload,
             config.get('jwtSecret'),
             {expiresIn:360000},
             (err, token) => {
                 if(err) throw err;
                 res.json({ token });
             }
             );



    }catch(err){
        console.log(err.message);
        res.status(500).send('server error');

    }




}
); 

module.exports = router; 