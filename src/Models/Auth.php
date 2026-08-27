<?php

class Auth{
    private string $id;
    private string $fullName;
    private string $email;
    private string $passwordHash;
    private DateTimeImmutable $createdAt;
    private DateTimeImmutable $updatedAt;

    public function __construct
    (
        string $id, 
        string $fullName, 
        string $email,
        string $passwordHash,
        DateTimeImmutable $createdAt,
        DateTimeImmutable $updatedAt
        )
    {
        $this->id = $id;
        $this->fullName = $fullName;
        $this->email = $email;
        $this->passwordHash = $passwordHash;
        $this->createdAt = $createdAt;
        $this->updatedAt = $updatedAt;
        // throw new \Exception('Not implemented');
    }

    public function mapToUserRow(array $data){
        $id = $data['id'];
        $fullName = $data['full_name'];
        $email = $data['email'];
        $passwordHash = $data['password_hash'];
        $createdAt = $data['created_at'];
        $updatedAt = $data['updated_at'];

        return new Auth($id, $fullName, $email, $passwordHash, $createdAt, $updatedAt);

    }

    public function getID(){ return $this->id;}
    public function getFullName(){ return $this->fullName;}
    public function getEmail(){ return $this->email;}
    public function getPasswordHash(){ return $this->passwordHash; }
    public function getCreatedAt(){ return $this->createdAt; }
    public function getUpdatedAt(){ return $this->updatedAt; }

    public function setID(string $id){ return $this->id; }
    public function setFullName(string $fullName){ return $this->fullName; }
    public function setEmail(string $email){ return $this->email; }
    public function setPasswordHash(string $passwordHash){ return $this->passwordHash; }
    public function setCreatedAt(string $createdAt){ return $this->createdAt; }
    public function setUpdatedAt(string $updatedAt){ return $this->updatedAt; }

}

?>