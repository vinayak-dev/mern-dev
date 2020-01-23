const express = require('express');
const request = require('request');
const config = require('config');
const router = express.Router();
const auth = require('../../middleware/auth');
const Profile = require('../../model/Profile'); 
const { check, validationResult } = require('express-validator');
const User = require('../../model/User');

//@rout GET api/profile/me
//@desc Get current user profile
//@access private
router.get('/me',auth, async (req,res) => {
    try{
        const profile = await Profile.findOne({ user: req.user.id }).populate('user', ['name', 'avatar']);

        if(!profile){
            return res.status(400).json({ msg: 'There is no profile for this user' });
        }
        res.json(profile);

    }catch(err){
        console.error(err.message);
        res.status(500).send('server error');
        
    }

}); 

//@rout GET api/profile
//@desc create or update user profile
//@access private
router.post('/', [auth, [
   check('status','status is required').not().isEmpty(), 
   check('skills','skills is required').not().isEmpty()
]],
async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array()});
    }
    const { 
        company,
        website,
        location,
        bio,
        status,
        githubusername,
        skills,
        youtube,
        facebook,   
        twitter,
        instagram,
        linkedin
    } = req.body;

    //Build profile object
    const profileFields =  {};
    profileFields.user = req.user.id;
    if(company) profileFields.company = company;    
    if(website) profileFields.website = website;    
    if(location) profileFields.location = location;    
    if(bio) profileFields.bio = bio;    
    if(status) profileFields.status = status;    
    if(githubusername) profileFields.githubusername = githubusername;
    if(skills){
        profileFields.skills = skills.split(',').map(skill => skill.trim());
    }
    console.log(profileFields.skills);

    //Build social object
    profileFields.social = {};
    if(youtube) profileFields.social.youtube = youtube;    
    if(twitter) profileFields.social.youtube = twitter;    
    if(facebook) profileFields.social.youtube = facebook;    
    if(linkedin) profileFields.social.youtube = linkedin;    
    if(instagram) profileFields.social.instagram = instagram;    

    try{
        let profile = await Profile.findOne( { user: req.user.id });
        if(profile){
            //update
            profile = await Profile.findOneAndUpdate(
                { user: req.user.id },
                { $set: profileFields },
                { new: true }
            );
            return res.json(profile);
        }
        
        //Create
        profile = new Profile(profileFields);
        await profile.save();
        res.json(profile);

    }catch(err){
        console.error(err.message);
        res.send(500).send('Server error');
        
    }


}
);

//@rout GET api/profile
//@desc Get all  profiles
//@access public
router.get('/', async (req,res) => {
    try {
        const profiles = await Profile.find().populate('user', ['name', 'avatar']);
        res.json(profiles);
        
    } catch (err) {
        console.error(err.message);
        res.send('server error');
                
    }
} );

//@rout GET api/profile/user/:userid
//@desc Get all  profile by userID
//@access public
router.get('/user/:user_id', async (req,res) => {
    try {
        const profile = await Profile.findOne({ user:req.params.user_id }).populate('user', ['name', 'avatar']);
        if(!profile)
        {
            return res.status(400).json({msg:'There is no profile for user' });
        }
        res.json(profile);
        
    } catch (err) {
        console.error(err.message);
        if(err.kind == 'ObjectId'){
            return res.status(400).json({msg:'There is no profile for user' });
        }
        res.send('server error');        
        
    }
} );


//@rout DELETE api/profile/user/:userid
//@desc Delete  profile, user & posts
//@access private
router.delete('/', auth,  async (req,res) => {
    try {
        // Remove user post
        // Remove profile   
        await Profile.findOneAndRemove({ user: req.user.id });
        //remove user
        await Profile.findOneAndRemove({ _id: req.user.id });

        res.json({ msg: 'User deleted' });
        
    } catch (err) {
        console.error(err.message);
        if(err.kind == 'ObjectId'){
            return res.status(400).json({msg:'There is no profile for user' });
        }
        res.send('server error');        
        
    }
} );

//@rout PUT api/profile/experience
//@desc Add  profile experience
//@access private
router.put('/experience', [auth,[
    check('title', 'title is requires').not().isEmpty(),
    check('company', 'company is requires').not().isEmpty(),
    check('from', 'from date is requires').not().isEmpty(),

]], async (req,res) => {
    const error = validationResult(req);
    if(!error.isEmpty()){
        return res.status(400).json({ error: error.array() });
    }
    const {
        title,
        company,
        location,
        from,
        to,
        current,
        description,
    } = req.body;

    const newExp = {
        title,
        company,
        location,
        from,
        to,
        current,
        description,
    }
    try {
        const profile = await Profile.findOne({ user : req.user.id });
        profile.experience.unshift(newExp);
        await profile.save();
        res.json(profile);
        
    } catch (error) {
        console.error(err.message);
        res.status(500).send('server error');
        
    }

} );

//@rout DELETE api/profile/experience/:exp_id
//@desc Delete profile from experience
//@access private
router.delete('/experience/:exp_id',auth, async(req,res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id });

        //Get remove index
        const removeIndex = profile.experience.map(item => item.id).indexOf(req.params.exp_id);
        profile.experience.splice(removeIndex,1);
        await profile.save();

        res.json(profile);
        
    } catch (error) {
        console.error(err.message);
        res.status(500).send('server error');        
    }
}
);


//@rout PUT api/profile/education
//@desc Add  profile education
//@access private
router.put('/education', [auth,[
    check('school', 'school is requires').not().isEmpty(),
    check('degree', 'degree is requires').not().isEmpty(),
    check('fieldofstudy', 'fielofstudy  is requires').not().isEmpty(),
    check('from', 'from date  is requires').not().isEmpty(),

]], async (req,res) => {
    const error = validationResult(req);
    if(!error.isEmpty()){
        return res.status(400).json({ error: error.array() });
    }
    const {
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description,
    } = req.body;

    const newEdu = {
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description,
    }
    try {
        const profile = await Profile.findOne({ user : req.user.id });
        profile.education.unshift(newEdu);
        await profile.save();
        res.json(profile);
        
    } catch (error) {
        console.error(err.message);
        res.status(500).send('server error');
        
    }

} );

//@rout DELETE api/profile/education/:edu_id
//@desc Delete profile from education
//@access private
router.delete('/education/:edu_id',auth, async(req,res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id });

        //Get remove index
        const removeIndex = profile.experience.map(item => item.id).indexOf(req.params.exp_id);
        profile.education.splice(removeIndex,1);
        await profile.save();

        res.json(profile);
        
    } catch (error) {
        console.error(err.message);
        res.status(500).send('server error');        
    }
}
);

//@rout GET  api/profile/github/:username
//@desc Get user repos from github
//@access public
router.get('/github/:username', (req,res) =>{
    try {
        const options = {
            uri: `https://api.github.com/users/${req.params.username}/repos?per_page=5&
            sort=created:asc&client_id=${config.get('githubClientId')}&client_secret=${config.get('githubClientSecret')}`,
            method:'GET',
            headers: { 'user-agent': 'node.js'}

        };  

        request(options, (error, response, body)=> {
            if(error) {console.error(error);}
            
            if(response.statusCode!==200){
                return res.status(404).json({ msg: 'No github profile found' });
            }
            res.json(JSON.parse(body));
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('SERVER ERROR');
       
    }

} 
);

module.exports = router;